const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        {/* Logo with pulse animation */}
        <div className="relative inline-block">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
          
          {/* Logo container with zoom animation */}
          <div className="relative animate-pulse-zoom">
            <img 
              src="/logo.svg" 
              alt="SmaHosp" 
              className="w-32 h-32 drop-shadow-2xl"
            />
          </div>
        </div>
        
        {/* Loading text */}
        <p className="mt-8 text-gray-700 font-semibold text-lg animate-fade-in">
          {message}
        </p>
        
        {/* Loading dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
