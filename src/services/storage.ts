import { PriceRecord } from '../types'
import { supabase } from '../lib/supabase'

const SETTINGS_KEY = 'pricecheck_settings'
const CACHE_KEY = 'pricecheck_records_cache'
const CACHE_TIMESTAMP_KEY = 'pricecheck_cache_timestamp'
const CACHE_DURATION = 5 * 60 * 1000

function getCachedRecords(): PriceRecord[] | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY)
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
        
        if (!cached || !timestamp) return null
        
        const cacheAge = Date.now() - parseInt(timestamp, 10)
        if (cacheAge > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY)
            localStorage.removeItem(CACHE_TIMESTAMP_KEY)
            return null
        }
        
        return JSON.parse(cached)
    } catch {
        return null
    }
}

function setCachedRecords(records: PriceRecord[]): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(records))
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch {
        // ignore storage errors
    }
}

export function clearRecordsCache(): void {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
}

function notifyRecordsChanged() {
    clearRecordsCache()
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event('pricecheck:records-changed'))
}

function notifySettingsChanged() {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event('pricecheck:settings-changed'))
}

function dbRecordToPriceRecord(dbRecord: any): PriceRecord {
    return {
        id: dbRecord.id,
        uniqueName: dbRecord.unique_name || '',
        productName: dbRecord.product_name,
        brand: dbRecord.brand,
        category: dbRecord.category,
        purchaseDate: dbRecord.purchase_date,
        channel: dbRecord.channel,
        totalPrice: Number(dbRecord.total_price),
        quantity: dbRecord.quantity,
        unitSpec: Number(dbRecord.unit_spec),
        unitType: dbRecord.unit_type,
        unitPrice: Number(dbRecord.unit_price),
        notes: dbRecord.notes || undefined,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
        deletedAt: dbRecord.deleted_at || undefined,
    }
}

function priceRecordToDbRecord(record: PriceRecord): any {
    return {
        id: record.id,
        unique_name: record.uniqueName,
        product_name: record.productName,
        brand: record.brand,
        category: record.category,
        purchase_date: record.purchaseDate,
        channel: record.channel,
        total_price: record.totalPrice,
        quantity: record.quantity,
        unit_spec: record.unitSpec,
        unit_type: record.unitType,
        unit_price: record.unitPrice,
        notes: record.notes || null,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
        deleted_at: record.deletedAt || null,
    }
}

export async function getAllRecordsForSync(): Promise<PriceRecord[]> {
    const { data, error } = await supabase
        .from('price_records')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('读取记录失败:', error)
        return []
    }

    return data.map(dbRecordToPriceRecord)
}

export async function replaceAllRecordsForSync(records: PriceRecord[]): Promise<void> {
    const snapshot = await getAllRecordsForSync()

    const { error: deleteError } = await supabase
        .from('price_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
        console.error('清空记录失败:', deleteError)
        throw deleteError
    }

    try {
        if (records.length > 0) {
            const dbRecords = records.map(priceRecordToDbRecord)
            const { error: insertError } = await supabase
                .from('price_records')
                .insert(dbRecords)

            if (insertError) {
                throw insertError
            }
        }

        notifyRecordsChanged()
    } catch (replaceError) {
        console.error('替换记录失败，开始回滚:', replaceError)

        if (snapshot.length > 0) {
            const snapshotDbRecords = snapshot.map(priceRecordToDbRecord)
            const { error: rollbackError } = await supabase
                .from('price_records')
                .insert(snapshotDbRecords)

            if (rollbackError) {
                console.error('回滚失败:', rollbackError)
                const replaceMessage = replaceError instanceof Error ? replaceError.message : String(replaceError)
                throw new Error(`导入失败且回滚失败: ${replaceMessage}`)
            }
        }

        notifyRecordsChanged()
        const replaceMessage = replaceError instanceof Error ? replaceError.message : String(replaceError)
        throw new Error(`导入失败，已回滚原数据: ${replaceMessage}`)
    }
}

export async function getAllRecords(options?: { useCache?: boolean }): Promise<PriceRecord[]> {
    if (options?.useCache !== false) {
        const cached = getCachedRecords()
        if (cached) {
            return cached
        }
    }
    
    const records = await getAllRecordsForSync()
    const activeRecords = records.filter(r => !r.deletedAt)
    setCachedRecords(activeRecords)
    return activeRecords
}

export async function refreshRecords(): Promise<PriceRecord[]> {
    const records = await getAllRecordsForSync()
    const activeRecords = records.filter(r => !r.deletedAt)
    setCachedRecords(activeRecords)
    return activeRecords
}

export async function getRecordById(id: string): Promise<PriceRecord | null> {
    const { data, error } = await supabase
        .from('price_records')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        console.error('获取记录失败:', error)
        return null
    }

    return data ? dbRecordToPriceRecord(data) : null
}

export async function addRecord(record: PriceRecord): Promise<void> {
    const nowIso = new Date().toISOString()
    const newRecord: PriceRecord = {
        ...record,
        createdAt: record.createdAt || nowIso,
        updatedAt: record.updatedAt || nowIso,
        deletedAt: undefined,
    }

    const { error } = await supabase
        .from('price_records')
        .insert(priceRecordToDbRecord(newRecord))

    if (error) {
        console.error('保存记录失败:', error)
        throw error
    }

    notifyRecordsChanged()
}

export async function updateRecord(id: string, updatedRecord: PriceRecord): Promise<void> {
    const nowIso = new Date().toISOString()
    const recordToUpdate = {
        ...priceRecordToDbRecord(updatedRecord),
        updated_at: updatedRecord.updatedAt || nowIso,
    }

    const { error } = await supabase
        .from('price_records')
        .update(recordToUpdate)
        .eq('id', id)

    if (error) {
        console.error('更新记录失败:', error)
        throw error
    }

    notifyRecordsChanged()
}

export async function deleteRecord(id: string): Promise<void> {
    const nowIso = new Date().toISOString()

    const { error } = await supabase
        .from('price_records')
        .update({
            deleted_at: nowIso,
            updated_at: nowIso,
        })
        .eq('id', id)

    if (error) {
        console.error('删除记录失败:', error)
        throw error
    }

    notifyRecordsChanged()
}

export async function getRecordsByUniqueName(uniqueName: string, useCache = true): Promise<PriceRecord[]> {
    if (useCache) {
        const cached = getCachedRecords()
        if (cached) {
            const records = cached.filter(r => 
                r.uniqueName.toLowerCase() === uniqueName.toLowerCase()
            )
            if (records.length === 0) return []
            
            const lowestPrice = Math.min(...records.map(r => r.unitPrice))
            const getSortTime = (record: PriceRecord) => {
                const createdAtTime = new Date(record.createdAt).getTime()
                if (!Number.isNaN(createdAtTime)) return createdAtTime
                const purchaseAtTime = new Date(record.purchaseDate).getTime()
                return Number.isNaN(purchaseAtTime) ? 0 : purchaseAtTime
            }

            return records.sort((a, b) => {
                const aIsLowest = a.unitPrice === lowestPrice
                const bIsLowest = b.unitPrice === lowestPrice

                if (aIsLowest && !bIsLowest) return -1
                if (!aIsLowest && bIsLowest) return 1

                return getSortTime(b) - getSortTime(a)
            })
        }
    }
    
    const { data, error } = await supabase
        .from('price_records')
        .select('*')
        .ilike('unique_name', uniqueName)
        .is('deleted_at', null)

    if (error) {
        console.error('查询记录失败:', error)
        return []
    }

    const records = data.map(dbRecordToPriceRecord)

    if (records.length === 0) return []

    const lowestPrice = Math.min(...records.map(r => r.unitPrice))
    const getSortTime = (record: PriceRecord) => {
        const createdAtTime = new Date(record.createdAt).getTime()
        if (!Number.isNaN(createdAtTime)) return createdAtTime
        const purchaseAtTime = new Date(record.purchaseDate).getTime()
        return Number.isNaN(purchaseAtTime) ? 0 : purchaseAtTime
    }

    return records.sort((a, b) => {
        const aIsLowest = a.unitPrice === lowestPrice
        const bIsLowest = b.unitPrice === lowestPrice

        if (aIsLowest && !bIsLowest) return -1
        if (!aIsLowest && bIsLowest) return 1

        return getSortTime(b) - getSortTime(a)
    })
}

export async function getAllUniqueNames(useCache = true): Promise<string[]> {
    if (useCache) {
        const cached = getCachedRecords()
        if (cached) {
            const uniqueNames = new Set(cached.map(r => r.uniqueName).filter(Boolean))
            return Array.from(uniqueNames).sort()
        }
    }
    
    const { data, error } = await supabase
        .from('price_records')
        .select('unique_name')
        .is('deleted_at', null)

    if (error) {
        console.error('获取唯一名称列表失败:', error)
        return []
    }

    const uniqueNames = new Set(data.map(r => r.unique_name).filter(Boolean))
    return Array.from(uniqueNames).sort()
}

export async function getRecordsByProduct(productName: string, brand: string): Promise<PriceRecord[]> {
    const { data, error } = await supabase
        .from('price_records')
        .select('*')
        .ilike('product_name', productName)
        .ilike('brand', brand)
        .is('deleted_at', null)

    if (error) {
        console.error('查询记录失败:', error)
        return []
    }

    const records = data.map(dbRecordToPriceRecord)

    if (records.length === 0) return []

    const lowestPrice = Math.min(...records.map(r => r.unitPrice))
    const getSortTime = (record: PriceRecord) => {
        const createdAtTime = new Date(record.createdAt).getTime()
        if (!Number.isNaN(createdAtTime)) return createdAtTime
        const purchaseAtTime = new Date(record.purchaseDate).getTime()
        return Number.isNaN(purchaseAtTime) ? 0 : purchaseAtTime
    }

    return records.sort((a, b) => {
        const aIsLowest = a.unitPrice === lowestPrice
        const bIsLowest = b.unitPrice === lowestPrice

        if (aIsLowest && !bIsLowest) return -1
        if (!aIsLowest && bIsLowest) return 1

        return getSortTime(b) - getSortTime(a)
    })
}

export async function getRecordsByCategory(category: string): Promise<PriceRecord[]> {
    const { data, error } = await supabase
        .from('price_records')
        .select('*')
        .ilike('category', category)
        .is('deleted_at', null)

    if (error) {
        console.error('查询记录失败:', error)
        return []
    }

    return data.map(dbRecordToPriceRecord)
}

export async function getAllCategories(): Promise<string[]> {
    const { data, error } = await supabase
        .from('price_records')
        .select('category')
        .is('deleted_at', null)

    if (error) {
        console.error('获取分类失败:', error)
        return []
    }

    const categories = new Set(data.map(r => r.category))
    return Array.from(categories).sort()
}

export async function searchRecords(keyword: string): Promise<PriceRecord[]> {
    const { data, error } = await supabase
        .from('price_records')
        .select('*')
        .is('deleted_at', null)
        .or(`product_name.ilike.%${keyword}%,brand.ilike.%${keyword}%,category.ilike.%${keyword}%,channel.ilike.%${keyword}%`)

    if (error) {
        console.error('搜索记录失败:', error)
        return []
    }

    return data.map(dbRecordToPriceRecord)
}

export async function exportData(): Promise<string> {
    const records = await getAllRecords()
    return JSON.stringify(records, null, 2)
}

export async function importData(jsonData: string): Promise<void> {
    try {
        const records = JSON.parse(jsonData) as any[]

        if (!Array.isArray(records)) {
            throw new Error('数据格式错误')
        }

        const validRecords: PriceRecord[] = []
        for (const raw of records) {
            if (!raw || typeof raw !== 'object') continue
            if (typeof raw.id !== 'string' || !raw.id) continue
            if (typeof raw.uniqueName !== 'string') continue
            if (typeof raw.productName !== 'string') continue
            if (typeof raw.brand !== 'string') continue
            if (typeof raw.category !== 'string') continue
            if (typeof raw.purchaseDate !== 'string') continue
            if (typeof raw.channel !== 'string') continue
            if (typeof raw.totalPrice !== 'number') continue
            if (typeof raw.quantity !== 'number') continue
            if (typeof raw.unitSpec !== 'number') continue
            if (typeof raw.unitType !== 'string') continue
            if (typeof raw.unitPrice !== 'number') continue
            if (typeof raw.createdAt !== 'string') continue

            validRecords.push({
                id: raw.id,
                uniqueName: raw.uniqueName,
                productName: raw.productName,
                brand: raw.brand,
                category: raw.category,
                purchaseDate: raw.purchaseDate,
                channel: raw.channel,
                totalPrice: raw.totalPrice,
                quantity: raw.quantity,
                unitSpec: raw.unitSpec,
                unitType: raw.unitType,
                unitPrice: raw.unitPrice,
                notes: typeof raw.notes === 'string' ? raw.notes : undefined,
                createdAt: raw.createdAt,
                updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : raw.createdAt,
                deletedAt: typeof raw.deletedAt === 'string' ? raw.deletedAt : undefined,
            })
        }

        await replaceAllRecordsForSync(validRecords)
    } catch (error) {
        console.error('导入数据失败:', error)
        throw error
    }
}

export function getSettings() {
    try {
        const data = localStorage.getItem(SETTINGS_KEY)
        return data ? JSON.parse(data) : { theme: 'light' }
    } catch (error) {
        console.error('读取设置失败:', error)
        return { theme: 'light' }
    }
}

export function saveSettings(settings: any): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
        notifySettingsChanged()
    } catch (error) {
        console.error('保存设置失败:', error)
        throw error
    }
}
