import type { ComponentChildren } from 'preact';
import type { MenuResult, MenuItem } from '../lib/pe';
import { langName, langToHtmlLang } from '../lib/lang';
import { formatMnemonic } from '../lib/format';

interface MenuDisplayProps {
  menus: MenuResult[];
}

function MenuPopup({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
      <div style={{ font: 'bold 12px/1 "Tahoma",sans-serif', color: '#555', padding: '0 2px 2px' }}>
        {formatMnemonic(title)}
      </div>
      <div style={{
        background: '#D4D0C8', minWidth: '120px',
        border: '1px solid', borderColor: '#FFF #404040 #404040 #FFF',
        boxShadow: 'inset 1px 1px 0 #D4D0C8, inset -1px -1px 0 #808080',
        padding: '2px',
      }}>
        {items.map((item, i) => {
          if (item.isSeparator) {
            return (
              <div key={i} style={{
                height: 0, margin: '3px 2px',
                borderTop: '1px solid #808080', borderBottom: '1px solid #FFF',
              }} />
            );
          }

          const parts = item.text.split('\t');
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '2px 4px 2px 2px',
              whiteSpace: 'nowrap', cursor: 'var(--win2k-cursor)',
              ...(item.isGrayed ? { color: '#808080' } : {}),
              ...(item.isDefault ? { fontWeight: 'bold' } : {}),
            }}>
              <span style={{ display: 'inline-block', width: '16px', textAlign: 'center', flexShrink: 0 }}>
                {item.isChecked ? '\u2713' : ''}
              </span>
              <span style={{ flex: 1 }}>{formatMnemonic(parts[0])}</span>
              {parts.length > 1 && (
                <span style={{ marginLeft: '16px', color: item.isGrayed ? '#808080' : '#000' }}>
                  {parts[1]}
                </span>
              )}
              {item.children && (
                <span style={{ marginLeft: '8px', fontSize: '8px', flexShrink: 0 }}>{'\u25BA'}</span>
              )}
            </div>
          );
        })}
      </div>
      {items.map((item, i) => {
        if (item.children && item.children.length > 0) {
          return (
            <div key={`sub-${i}`} style={{ marginTop: '2px', marginLeft: '12px' }}>
              <MenuPopup title={'\u25BA ' + item.text} items={item.children} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

function MenuView({ menu }: { menu: MenuResult['menu'] }) {
  return (
    <div style={{ display: 'inline-block', background: '#D4D0C8', font: '12px/1 "Tahoma",sans-serif', color: '#000' }}>
      <div style={{ display: 'flex', background: '#D4D0C8', padding: '1px', borderBottom: '1px solid #808080' }}>
        {menu.items.map((item, i) => (
          <div key={i} style={{ padding: '2px 6px', cursor: 'var(--win2k-cursor)', whiteSpace: 'nowrap' }}>
            {formatMnemonic(item.text)}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1px', padding: '2px' }}>
        {menu.items.map((item, i) => {
          if (item.children && item.children.length > 0) {
            return <MenuPopup key={i} title={item.text} items={item.children} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function MenuDisplay({ menus }: MenuDisplayProps) {
  const hasMultipleLangs = new Set(menus.map(m => m.languageId)).size > 1;

  return (
    <>
      {menus.map((m, i) => {
        const idText = m.name ? `"${m.name}"` : `#${m.id}`;
        const langBadge = (hasMultipleLangs && m.languageId != null) ? ` [${langName(m.languageId)}]` : '';
        return (
          <div key={i} class="w-full mb-3">
            <div class="text-[11px] text-gray-400 mb-1">Menu {idText}{langBadge}</div>
            <div lang={langToHtmlLang(m.languageId) || undefined}>
              <MenuView menu={m.menu} />
            </div>
          </div>
        );
      })}
    </>
  );
}
