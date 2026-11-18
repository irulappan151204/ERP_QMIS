import React from 'react'
import { NavLink } from 'react-router-dom'
import { X, CircleCheck } from 'lucide-react'

const MenuItemModal = ({ menuItemModal, setMenuItemModal }) => {
    return (
        <>
            {menuItemModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center'>
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMenuItemModal(false)}
                    />

                    <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-lg p-5 py-4">
                        <div className='flex justify-end items-center'>
                            <button type='button' onClick={() => setMenuItemModal(false)} className='hover:text-red-500 cursor-pointer'>
                                <X />
                            </button>
                        </div>
                        <div className='pt-4 text-center'>
                            <div className='flex justify-center items-center mb-4'>
                                <CircleCheck size={70} strokeWidth={1.5} className='text-[#4CAF50]' />
                            </div>
                            <h3 className='text-xl font-bold text-slate-900'>Menu Item Saved</h3>
                            <p className='text-sm text-slate-600 font-medium mt-1'>
                                The menu item has been added successfully.
                            </p>

                            <div className='flex gap-x-4 mt-10'>
                                <button
                                    type='button'
                                    onClick={() => setMenuItemModal(false)}
                                    className='bg-white text-slate-700 text-sm font-semibold text-center px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 cursor-pointer w-full'
                                >
                                    Add Another
                                </button>
                                <NavLink
                                    to="/canteen-manager/menu-management"
                                    className='bg-[#515DEF] text-white text-sm text-center px-4 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer w-full'
                                >
                                    Back to List
                                </NavLink>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default MenuItemModal
