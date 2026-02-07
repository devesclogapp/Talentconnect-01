import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const SplashScreen: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="fixed inset-0 bg-app-bg flex flex-col items-center justify-center z-[9999]">
            <div className={`transform transition-all duration-1000 ease-out flex flex-col items-center ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                {/* Visual Logo Placeholder */}
                <div className="relative mb-6">
                    <div className="absolute -inset-4 bg-brand-primary/10 rounded-full blur-2xl animate-pulse"></div>
                    <div className="w-24 h-24 bg-brand-primary rounded-[28px] flex items-center justify-center shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <Sparkles className="text-white w-12 h-12" />
                    </div>
                </div>

                <div className="text-center">
                    <h1 className="heading-xl tracking-tight mb-2">
                        Talent <span className="text-brand-primary dark:text-white">Connect</span>
                    </h1>
                    <p className="meta-bold text-app-muted tracking-[0.2em] animate-pulse">
                        Carregando...
                    </p>
                </div>
            </div>

            {/* Bottom Credit */}
            <div className="absolute bottom-12 transition-opacity duration-1000 delay-500 opacity-40">
                <p className="meta label-semibold">Powered by Talent Connect AI</p>
            </div>

            {/* Background Decorative Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[100px]"></div>
        </div>
    );
};

export default SplashScreen;
