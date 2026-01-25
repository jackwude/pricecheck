import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings, saveSettings, exportData, importData } from '../services/storage'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/ToastProvider'
import { Download, Upload, Sun, Moon } from 'lucide-react'

export default function SettingsPage() {
    const navigate = useNavigate()
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const { push } = useToast()

    useEffect(() => {
        const settings = getSettings()
        setTheme(settings.theme || 'light')
    }, [])

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme)
        saveSettings({ theme: newTheme })
        document.documentElement.setAttribute('data-theme', newTheme)
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
