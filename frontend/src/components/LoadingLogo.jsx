const LoadingLogo = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`inline-block ${className}`}>
      <img 
        src="/logo.svg" 
        alt="Loading" 
        className={`${sizeClasses[size]} animate-pulse-zoom drop-shadow-lg`}
      />
    </div>
  );
};

export default LoadingLogo;
