import React from "react";
import { assets} from '../assets/assets';

const Footer = () => {
    return (
        <footer className="px-6  md:px-16 lg:px-36 mt-40 w-full text-gray-300">
            <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500 pb-14">
                <div className="md:max-w-96">
                    <img className="w-36 h-auto" src={assets.logo} alt="logo" />
                    <p className="mt-6 text-sm">
                        Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                        <img src={assets.googlePlay} alt="google play" className="h-9 w-auto" />
                        <img src={assets.appStore} alt="app store" className="h-9 w-auto " />
                    </div>
                </div>
                <div className="flex-1 flex items-start md:justify-end gap-20 md:gap-40">
                    <div>
                        <h2 className="font-bold text-base text-white mb-5">Company</h2>
                        <ul className="text-sm space-y-2.5 text-slate-300">
                            <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">About us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacy policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-bold text-base text-white mb-5">Get in touch</h2>
                        <div className="text-sm space-y-2.5 text-slate-300">
                            <p>+94 11 208 3000</p>
                            <p>contact@quickshow.lk</p>
                        </div>
                    </div>
                </div>
            </div>
            <p className="pt-4 text-center text-sm text-slate-400 pb-5">
                Copyright {new Date().getFullYear()} © QuickShow LK. All Rights Reserved.
            </p>
        </footer>
    );
};

export default Footer;