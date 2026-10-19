import React from "react";
import { assets} from '../assets/assets';

const Footer = () => {
    return (
        <footer className="px-6  md:px-16 lg:px-36 mt-40 w-full text-gray-300">
            <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500 pb-14">
                <div className="md:max-w-96">
                    <img className="w-40 h-auto" src={assets.logo} alt="logo" />
                    <p className="mt-6 text-base text-slate-300 leading-relaxed font-normal">
                        QuickShow LK is Sri Lanka's premier online cinema booking platform for Scope Cinemas, Savoy, PVR, and Regal Theaters nationwide.
                    </p>
                    <div className="flex items-center gap-3 mt-5">
                        <img src={assets.googlePlay} alt="google play" className="h-10 w-auto cursor-pointer" />
                        <img src={assets.appStore} alt="app store" className="h-10 w-auto cursor-pointer" />
                    </div>
                </div>
                <div className="flex-1 flex items-start md:justify-end gap-20 md:gap-40">
                    <div>
                        <h2 className="font-extrabold text-lg text-white mb-5">Company</h2>
                        <ul className="text-base space-y-3 text-slate-300 font-medium">
                            <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">About us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacy policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-lg text-white mb-5">Get in touch</h2>
                        <div className="text-base space-y-3 text-slate-300 font-medium">
                            <p className="font-mono">+94 11 208 3000</p>
                            <p>contact@quickshow.lk</p>
                        </div>
                    </div>
                </div>
            </div>
            <p className="pt-6 text-center text-base text-slate-400 pb-6 font-medium">
                Copyright {new Date().getFullYear()} © QuickShow LK. All Rights Reserved.
            </p>
        </footer>
    );
};

export default Footer;