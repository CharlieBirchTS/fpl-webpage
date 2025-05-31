// src/components/common/Layout/index.js
import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, activeSection, handleMenuClick, selectedManagerId, managersData, setSelectedManagerId }) => {
    return (
        <div className="app-container flex min-h-screen bg-gray-100">
            <Sidebar
                activeSection={activeSection}
                handleMenuClick={handleMenuClick}
                selectedManagerId={selectedManagerId}
                managersData={managersData}
                setSelectedManagerId={setSelectedManagerId}
            />

            <main className="flex-1">
                {children} {/* This is where the content of the page will be rendered */}
            </main>
        </div>
    );
};

export default Layout;