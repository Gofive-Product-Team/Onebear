import { Component, type ReactNode } from 'react'

interface Props {
	children: ReactNode
	fallback?: ReactNode
}

interface State {
	hasError: boolean
	error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('ErrorBoundary caught:', error, errorInfo)
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) return this.props.fallback
			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-50">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center">
						<h1 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h1>
						<p className="text-gray-600 text-sm mb-4">{this.state.error?.message ?? 'An unexpected error occurred'}</p>
						<button
							onClick={() => window.location.reload()}
							className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
						>
							Reload Page
						</button>
					</div>
				</div>
			)
		}
		return this.props.children
	}
}
