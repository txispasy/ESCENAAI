import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';

const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-brand-surface p-6 flex-col flex-shrink-0 hidden md:flex">
            <div className="flex items-center mb-12">
                <span className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-accent text-transparent bg-clip-text">
                    Escena.AI
                </span>
            </div>
            <nav className="flex flex-col space-y-2">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                                isActive
                                    ? 'bg-brand-primary/20 text-white'
                                    : 'text-brand-text-muted hover:bg-white/10 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;