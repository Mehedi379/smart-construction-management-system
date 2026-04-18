import logo from '../assets/logo.png';

/**
 * BrandLogo Component
 * Reusable branded logo component for consistent branding across the app
 */
const BrandLogo = ({ variant = 'full', size = 'medium', className = '' }) => {
    const sizeClasses = {
        small: {
            container: 'w-10 h-10',
            logo: 'w-8 h-8',
            text: 'text-sm'
        },
        medium: {
            container: 'w-16 h-16',
            logo: 'w-14 h-14',
            text: 'text-base'
        },
        large: {
            container: 'w-24 h-24',
            logo: 'w-20 h-20',
            text: 'text-2xl'
        },
        xl: {
            container: 'w-32 h-32',
            logo: 'w-28 h-28',
            text: 'text-3xl'
        }
    };

    const sizes = sizeClasses[size];

    if (variant === 'icon') {
        return (
            <div className={`${sizes.container} rounded-xl flex items-center justify-center ${className}`}>
                <img 
                    src={logo} 
                    alt="Logo" 
                    className={`${sizes.logo} object-contain drop-shadow-lg`}
                />
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                    <img 
                        src={logo} 
                        alt="Logo" 
                        className="w-10 h-10 object-contain drop-shadow-md"
                    />
                </div>
                <div>
                    <h1 className={`${sizes.text} font-bold text-gray-900 leading-tight`}>Smart Construction</h1>
                    <p className="text-xs text-gray-600 font-semibold mt-0.5">M/S Khaza Bilkis Rabbi</p>
                </div>
            </div>
        );
    }

    // Full variant (default)
    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className={`${sizes.container} rounded-2xl flex items-center justify-center drop-shadow-xl`}>
                <img 
                    src={logo} 
                    alt="M/S Khaza Bilkis Rabbi Logo" 
                    className={`${sizes.logo} object-contain rounded-lg`}
                />
            </div>
            <h1 className={`${sizes.text} font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 bg-clip-text text-transparent mt-4 mb-2`}>
                Smart Construction
            </h1>
            <p className="text-base text-gray-800 font-bold mb-3">M/S Khaza Bilkis Rabbi</p>
            <div className="flex items-center justify-center gap-3">
                <div className="h-0.5 w-16 bg-gradient-to-r from-transparent to-primary-500"></div>
                <div className="px-3 py-1 bg-gradient-to-r from-primary-700 to-primary-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                    Management System
                </div>
                <div className="h-0.5 w-16 bg-gradient-to-l from-transparent to-primary-500"></div>
            </div>
        </div>
    );
};

export default BrandLogo;
