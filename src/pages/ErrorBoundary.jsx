import React from "react";
import { useNavigate } from "react-router-dom";

// CLASS COMPONENT (Error Boundary)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
  }

  // Method to reset the error
  resetError = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      // Render the functional fallback component and pass resetError
      return <ErrorFallback resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// FUNCTIONAL COMPONENT (FALLBACK UI)
function ErrorFallback({ resetError }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    resetError();   // reset the error state first
    navigate("/");  // navigate to home
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-6">
      <div className="bg-white shadow-2xl rounded-3xl p-10 md:p-16 max-w-lg text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20 text-red-600 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 
              1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L4.34 
              16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          An unexpected error occurred. Refresh or go back home.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
          >
            Refresh
          </button>
          <button
            onClick={handleGoHome}
            className="px-6 py-3 border border-gray-300 rounded-xl shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
          >
            Go Home
          </button>
        </div>

        <div className="mt-8 text-gray-400 text-sm">
          🚀 We are already working to fix it!
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
