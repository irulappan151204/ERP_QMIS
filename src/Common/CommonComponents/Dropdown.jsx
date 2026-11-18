import { useState, useRef, useEffect } from "react";

export default function Dropdown({ buttonContent, children }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef();

    // close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block w-full sm:w-auto" ref={dropdownRef}>

            {/* Button */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold px-3.5 py-2 cursor-pointer transition-colors"
            >
                {buttonContent}
            </button>

            {/* Dropdown */}
            {open && (
                <>
                    {/* Mobile Overlay */}
                    <div
                        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 sm:hidden"
                        onClick={() => setOpen(false)}
                    />

                    <div
                        className="absolute z-50 right-0 w-36 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 animate-in fade-in zoom-in-95">
                        <div className="text-xs flex flex-col gap-0.5">
                            {children}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}