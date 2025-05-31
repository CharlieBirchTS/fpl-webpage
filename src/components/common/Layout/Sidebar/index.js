// src/components/common/Layout/Sidebar/index.js
import React from 'react';
import logo from '../../../../assets/images/fpl-webpage-logo.png';

const Sidebar = ({
    activeSection,
    handleMenuClick,
    selectedManagerId,
    managersData,
    setSelectedManagerId
}) => {
    return (
        <div className="sidebar bg-gray-800 w-64 min-h-screen flex flex-col items-center py-6 fixed left-0">
            <div className="logo-container mb-8 w-full px-4">
                <img
                    src={logo}
                    alt="Logo"
                    className="w-full h-auto object-contain max-w-[150px] mx-auto"
                />
            </div>

            {/* Navigation Links */}
            <div className="menu flex flex-col w-full px-4 space-y-4">
                <button
                    onClick={() => handleMenuClick('home')}
                    className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 ${activeSection === 'home'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                >
                    Home
                </button>
                <button
                    onClick={() => handleMenuClick('h2h')}
                    className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 ${activeSection === 'h2h'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                >
                    H2H
                </button>
            </div>
        </div>
    );
};

export default Sidebar;