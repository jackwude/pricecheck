import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings, saveSettings, exportData, importData } from '../services/storage'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/ToastProvider'
import { Download, Upload, Sun, Moon, Link2, RefreshCcw } from 'lucide-react'
import { buildSyncLink, ensureSyncHash } from '../sync/hash'
import { getSyncState, subscribeSyncState } from '../sync/state'
import { initSync } from '../sync/sync'
import { normalizeSyncApiUrl } from '../sync/url'

export default function SettingsPage() {
    const navigate = useNavigate()
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const [syncApiUrl, setSyncApiUrl] = useState('')
    const [syncLink, setSyncLink] = useState('')
    const [syncStatus, setSyncStatus] = useState(getSyncState())
    const { push } = useToast()

    useEffect(() => {
        const settings = getSettings()
        setTheme(settings.theme || 'light')
        const normalizedSettingsApi = typeof settings.syncApiUrl === 'string' ? normalizeSyncApiUrl(settings.syncApiUrl) : ''
        const isGitHubPages = window.location.hostname.endsWith('github.io')
        const defaultApi = isGitHubPages ? '' : '/api/sync'
        setSyncApiUrl(normalizedSettingsApi || defaultApi)

        const { syncId, api } = ensureSyncHash()
        const normalizedApi = normalizeSyncApiUrl(api || '') || normalizedSettingsApi || defaultApi
        setSyncLink(buildSyncLink(syncId, normalizedApi || undefined))

        const unsub = subscribeSyncState(() => setSyncStatus(getSyncState()))
        return () => unsub()
    }, [])

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme)
        const settings = getSettings()
        saveSettings({ ...settings, theme: newTheme })
        document.documentElement.setAttribute('data-theme', newTheme)
    }

    const handleSaveSyncApiUrl = () => {
        const trimmed = normalizeSyncApiUrl(syncApiUrl)
        const isGitHubPages = window.location.hostname.endsWith('github.io')
        const defaultApi = isGitHubPages ? '' : '/api/sync'
        setSyncApiUrl(trimmed || defaultApi)
        const settings = getSettings()
        saveSettings({ ...settings, syncApiUrl: trimmed })
        const { syncId } = ensureSyncHash()
        const apiParam = trimmed || defaultApi
        const nextLink = buildSyncLink(syncId, apiParam || undefined)
        setSyncLink(nextLink)
        const hash = apiParam ? `#sync=${encodeURIComponent(syncId)}&api=${encodeURIComponent(apiParam)}` : `#sync=${encodeURIComponent(syncId)}`
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`)
        initSync()
        push({ title: '同步配置已保存', description: trimmed ? '已启用跨设备同步。' : '已关闭跨设备同步。', variant: 'success' })
    }

    const handleCopySyncLink = async () => {
        try {
            await navigator.clipboard.writeText(syncLink)
            push({ title: '已复制同步链接', description: '在另一台设备打开该链接即可同步同一份数据。', variant: 'success' })
        } catch {
            push({ title: '复制失败', description: '请手动复制链接内容。', variant: 'danger' })
        }
    }

    const handleSyncNow = () => {
        window.dispatchEvent(new Event('pricecheck:records-changed'))
        push({ title: '已触发同步', description: '正在尝试与云端同步数据。', variant: 'success' })
    }

    const handleExport = () => {
        try {
            const data = exportData()
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `pricecheck-backup-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            push({ title: '数据导出成功', description: '已下载为 JSON 备份文件。', variant: 'success' })
        } catch (error) {
            push({ title: '导出失败', description: '请重试。', variant: 'danger' })
        }
    }

    const handleImport = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                    try {
                        const jsonData = event.target?.result as string
                        importData(jsonData)
                        push({ title: '数据导入成功', description: '已覆盖现有数据。', variant: 'success' })
                        navigate('/')
                    } catch (error) {
                        push({ title: '导入失败', description: '请检查文件格式是否正确。', variant: 'danger' })
                    }
                }
                reader.readAsText(file)
            }
        }
        input.click()
    }

    return (
        <div className="page">
            <header className="page-header">
                <button className="back-button" onClick={() => navigate('/')}>
                    ← 返回
                </button>
                <h1>设置</h1>
            </header>

            <div className="settings-container">
                <Card className="settings-card">
                    <div className="form-card-title">外观</div>
                    <div className="settings-row">
                        <div className="settings-row-label">主题</div>
                        <div className="settings-toggle-row">
                            <Button
                                size="sm"
                                variant={theme === 'light' ? 'primary' : 'secondary'}
                                type="button"
                                onClick={() => handleThemeChange('light')}
                            >
                                <Sun size={18} />
                                浅色
                            </Button>
                            <Button
                                size="sm"
                                variant={theme === 'dark' ? 'primary' : 'secondary'}
                                type="button"
                                onClick={() => handleThemeChange('dark')}
                            >
                                <Moon size={18} />
                                深色
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card className="settings-card">
                    <div className="form-card-title">同步</div>
                    <div className="settings-row" style={{ alignItems: 'flex-start' }}>
                        <div className="settings-row-label">同步服务地址</div>
                        <div style={{ width: '100%' }}>
                            <Input
                                type="text"
                                value={syncApiUrl}
                                onChange={(e) => setSyncApiUrl(e.target.value)}
                                placeholder="例如：/api/sync 或 https://xxx.workers.dev/sync"
                            />
                            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
                                不要带 <code>?sid=...</code>，应用会自动拼接。推荐同域：<code>/api/sync</code>
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                <Button size="sm" variant="primary" type="button" onClick={handleSaveSyncApiUrl}>
                                    保存
                                </Button>
                                <Button size="sm" variant="secondary" type="button" onClick={handleSyncNow} disabled={!syncApiUrl.trim()}>
                                    <RefreshCcw size={16} />
                                    立即同步
                                </Button>
                            </div>
                            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                                状态：{syncStatus.status}
                                {syncStatus.lastSyncedAt ? `，上次同步：${syncStatus.lastSyncedAt}` : ''}
                                {syncStatus.lastError ? `，错误：${syncStatus.lastError}` : ''}
                            </div>
                        </div>
                    </div>

                    <div className="settings-row" style={{ alignItems: 'flex-start' }}>
                        <div className="settings-row-label">同步链接</div>
                        <div style={{ width: '100%' }}>
                            <Input type="text" value={syncLink} readOnly />
                            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                <Button size="sm" variant="secondary" type="button" onClick={handleCopySyncLink}>
                                    <Link2 size={16} />
                                    复制链接
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="settings-card">
                    <div className="form-card-title">数据管理</div>
                    <button className="settings-action" onClick={handleExport} type="button">
                        <span className="settings-action-icon" aria-hidden="true">
                            <Download size={18} />
                        </span>
                        <span className="settings-action-text">
                            <span className="settings-action-title">导出数据</span>
                            <span className="settings-action-desc">将所有记录导出为 JSON 文件</span>
                        </span>
                    </button>
                    <button className="settings-action" onClick={handleImport} type="button">
                        <span className="settings-action-icon" aria-hidden="true">
                            <Upload size={18} />
                        </span>
                        <span className="settings-action-text">
                            <span className="settings-action-title">导入数据</span>
                            <span className="settings-action-desc">从 JSON 文件导入记录（会覆盖现有数据）</span>
                        </span>
                    </button>
                </Card>

                <Card className="settings-card">
                    <div className="form-card-title">关于</div>
                    <div className="about-info">
                        <p><strong>价格追踪</strong></p>
                        <p>版本 1.0.0</p>
                        <p>记录商品历史价格，帮助你做出更明智的购买决策</p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
