import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';

const BottomNav: React.FC = () => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-surface/80 backdrop-blur-sm border-t border-white/10 p-1 flex justify-around items-center z-50">
            {NAV_ITEMS.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center space-y-1 w-full rounded-md py-2 transition-colors duration-200 ${
                            isActive
                                ? 'text-brand-primary'
                                : 'text-brand-text-muted hover:text-white'
                        }`
                    }
                >
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{item.name}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;