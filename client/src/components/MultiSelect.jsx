import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineChevronDown, HiOutlineX } from 'react-icons/hi';

const MENU_MAX_HEIGHT = 256;
const MENU_PADDING = 8;

export default function MultiSelect({
  values = [],
  onChange,
  options = [],
  placeholder = 'Select options',
  label,
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const triggerRef = useRef(null);

  const filteredOptions = options.filter((opt) =>
    (opt.label || opt.name || opt.title || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const computeMenuStyle = () => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_PADDING;
    const spaceAbove = rect.top - MENU_PADDING;
    const showAbove = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;
    return {
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(showAbove
        ? { bottom: window.innerHeight - rect.top + MENU_PADDING }
        : { top: rect.bottom + MENU_PADDING }),
    };
  };

  const handleOpen = () => {
    if (disabled) return;
    if (!isOpen) setMenuStyle(computeMenuStyle());
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    const close = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    const reposition = () => setMenuStyle(computeMenuStyle());
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen]);

  const toggle = (val) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const remove = (val, e) => {
    e.stopPropagation();
    onChange(values.filter((v) => v !== val));
  };

  const getLabelForValue = (val) => {
    const opt = options.find((o) => (o.value ?? o._id ?? o.id) === val || o.name === val);
    return opt ? (opt.label || opt.name || opt.title) : val;
  };

  const menu = isOpen && (
    <div
      style={menuStyle}
      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      {options.length > 5 && (
        <div className="p-2 border-b border-gray-100 dark:border-white/[0.06]">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:border-violet-500"
          />
        </div>
      )}
      <div className="max-h-64 overflow-y-auto p-1">
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 dark:text-slate-500 text-center">No options found</div>
        ) : (
          filteredOptions.map((option, index) => {
            const val = option.value ?? option._id ?? option.id ?? option.name;
            const selected = values.includes(val);
            return (
              <button
                key={index}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); toggle(val); }}
                className={`w-full px-3 py-2 text-left text-sm rounded-xl transition-colors flex items-center gap-2 ${
                  selected
                    ? 'bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-300 font-medium'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
                  selected ? 'bg-violet-600 border-violet-600' : 'border-gray-300 dark:border-slate-500'
                }`}>
                  {selected && <HiOutlineX className="w-2.5 h-2.5 text-white" style={{ strokeWidth: 3 }} />}
                </div>
                {option.label || option.name || option.title}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div ref={triggerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className="w-full min-h-[42px] px-4 py-2 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl text-left flex items-start justify-between gap-2 hover:border-gray-400 dark:hover:border-white/20 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <div className="flex flex-wrap gap-1.5 flex-1">
          {values.length === 0 ? (
            <span className="text-sm text-gray-400 dark:text-slate-500 self-center">{placeholder}</span>
          ) : (
            values.map((val) => (
              <span key={val} className="inline-flex items-center gap-1 text-xs bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-lg font-medium">
                {getLabelForValue(val)}
                <button type="button" onMouseDown={(e) => remove(val, e)} className="hover:text-violet-900 dark:hover:text-violet-100">
                  <HiOutlineX className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <HiOutlineChevronDown
          className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform shrink-0 mt-1 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {createPortal(menu, document.body)}
    </div>
  );
}
