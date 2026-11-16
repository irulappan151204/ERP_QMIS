import React from 'react'
import { AlertTriangle, RefreshCw, LogIn, Trash2 } from 'lucide-react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo })
        // Log telemetry
        console.error('Enterprise Error Boundary caught an exception:', error, errorInfo)
    }

    handleReload = () => {
        window.location.reload()
    }

    handleGoToLogin = () => {
        try {
            sessionStorage.removeItem('schoolerp_auth')
        } catch {
            /* ignore */
        }
        window.location.href = '/'
    }

    handleResetStorage = () => {
        try {
            sessionStorage.clear()
            localStorage.removeItem('schoolerp_auth_persistent')
        } catch {
            /* ignore */
        }
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            const message = this.state.error?.message || 'An unexpected runtime error occurred.'

            return (
                <div className='min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 font-sans'>
                    <div className='bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 max-w-lg w-full space-y-6 text-center animate-in fade-in duration-200'>
                        <div className='w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs'>
                            <AlertTriangle size={32} />
                        </div>

                        <div className='space-y-2'>
                            <h2 className='text-xl font-bold text-slate-900'>Application Recovery Mode</h2>
                            <p className='text-xs text-slate-500 max-w-md mx-auto'>
                                The system encountered an unexpected issue while rendering this interface. Your data remains safe and synchronized in the background.
                            </p>
                        </div>

                        <div className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-left text-xs font-mono text-red-800 break-words max-h-36 overflow-y-auto'>
                            {message}
                        </div>

                        <div className='flex flex-col sm:flex-row items-center justify-center gap-3 pt-2'>
                            <button
                                type='button'
                                onClick={this.handleReload}
                                className='w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer'
                            >
                                <RefreshCw size={15} />
                                Reload Application
                            </button>
                            <button
                                type='button'
                                onClick={this.handleGoToLogin}
                                className='w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer'
                            >
                                <LogIn size={15} />
                                Return to Sign In
                            </button>
                        </div>

                        <div className='pt-4 border-t border-slate-100 text-[11px] text-slate-400'>
                            <button
                                type='button'
                                onClick={this.handleResetStorage}
                                className='text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer transition-colors'
                            >
                                <Trash2 size={12} /> Clear Temporary Session Cache
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
