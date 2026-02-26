import type { ComponentChildren } from 'preact';
import type { DialogResult, DialogTemplate, DialogItem } from '../lib/pe';
import { langName, langToHtmlLang } from '../lib/lang';
import { formatMnemonic } from '../lib/format';
import { Frame } from './win2k/Frame';
import { Button } from './win2k/Button';
import { Checkbox } from './win2k/Checkbox';
import { Radio } from './win2k/Radio';
import { GroupBox } from './win2k/GroupBox';
import { Static } from './win2k/Static';
import { Edit } from './win2k/Edit';
import { ComboBox } from './win2k/ComboBox';
import { ListBox } from './win2k/ListBox';
import { Progress } from './win2k/Progress';
import { Trackbar } from './win2k/Trackbar';
import { ScrollBar } from './win2k/ScrollBar';
import { UpDown } from './win2k/UpDown';
import { ListView } from './win2k/ListView';
import { HotKey } from './win2k/HotKey';
import { TreeView } from './win2k/TreeView';

export interface ResUrls {
  icons: Map<number | string, string>;
  bitmaps: Map<number | string, string>;
  appIconUrl: string | null;
}

interface DialogDisplayProps {
  dialogs: DialogResult[];
  resUrls: ResUrls;
}

function DialogItemView({ item, dluX, dluY, fontCSS, resUrls }: {
  item: DialogItem;
  dluX: (v: number) => number;
  dluY: (v: number) => number;
  fontCSS: string;
  resUrls: ResUrls;
}) {
  const left = dluX(item.x), top = dluY(item.y);
  const width = dluX(item.cx), height = dluY(item.cy);
  const text = item.text || '';
  const s = item.style;
  const cn = item.className;

  const wrapStyle: Record<string, string | number | undefined> = {
    position: 'absolute', left: `${left}px`, top: `${top}px`,
    width: `${width}px`, height: `${height}px`, font: fontCSS,
  };

  let content: ComponentChildren = null;
  const wrapExtra: Record<string, string | number | undefined> = {};

  if (cn === 'Button') {
    const bt = s & 0x0F;
    if (bt === 0x07) {
      wrapExtra.background = '#D4D0C8';
      content = <GroupBox label={formatMnemonic(text)} fontCSS={fontCSS} bgColor="#D4D0C8">{null}</GroupBox>;
    } else if (bt === 0x02 || bt === 0x03 || bt === 0x05 || bt === 0x06) {
      wrapExtra.background = '#D4D0C8';
      content = <Checkbox fontCSS={fontCSS}>{formatMnemonic(text)}</Checkbox>;
    } else if (bt === 0x04 || bt === 0x09) {
      wrapExtra.background = '#D4D0C8';
      content = <Radio fontCSS={fontCSS}>{formatMnemonic(text)}</Radio>;
    } else {
      const BS_ICON = 0x0040, BS_BITMAP = 0x0080;
      let imgContent: ComponentChildren = null;
      if ((s & BS_BITMAP) && item.titleOrdinal != null) {
        const url = resUrls.bitmaps.get(item.titleOrdinal);
        if (url) imgContent = <img src={url} style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }} />;
      } else if ((s & BS_ICON) && item.titleOrdinal != null) {
        const url = resUrls.icons.get(item.titleOrdinal);
        if (url) imgContent = <img src={url} style={{ maxWidth: '100%', maxHeight: '100%' }} />;
      }
      if (bt === 0x0B && !text && !imgContent) {
        // BS_OWNERDRAW with no text/image — content drawn by application at runtime
        content = (
          <Button fontCSS={fontCSS} isDefault={false}>
            <span style={{ color: '#808080', fontSize: '9px' }}>owner-draw</span>
          </Button>
        );
      } else {
        content = (
          <Button fontCSS={fontCSS} isDefault={bt === 0x01}>
            {imgContent || formatMnemonic(text)}
          </Button>
        );
      }
    }
  } else if (cn === 'Edit') {
    const hasClientEdge = !!(item.exStyle & 0x200);
    const hasBorder = !!(s & 0x800000);
    const isReadonly = !!(s & 0x0800);
    const bg = (isReadonly && !hasClientEdge) ? 'transparent' : isReadonly ? '#D4D0C8' : '#FFF';
    content = (
      <Edit
        text={text} fontCSS={fontCSS}
        multiline={!!(s & 0x0004)} password={!!(s & 0x0020)}
        readonly={isReadonly} sunken={hasClientEdge}
        thinBorder={!hasClientEdge && hasBorder} bgColor={bg}
      />
    );
  } else if (cn === 'Static') {
    const iconUrl = item.titleOrdinal != null ? resUrls.icons.get(item.titleOrdinal) ?? null : null;
    const bitmapUrl = item.titleOrdinal != null ? resUrls.bitmaps.get(item.titleOrdinal) ?? null : null;
    content = <Static style={s} text={text} fontCSS={fontCSS} iconUrl={iconUrl} bitmapUrl={bitmapUrl} />;
  } else if (cn === 'ListBox') {
    content = <ListBox fontCSS={fontCSS} />;
  } else if (cn === 'ComboBox') {
    const cbType = s & 0x0F;
    if (cbType === 0x01) {
      content = (
        <select size={Math.max(2, Math.round(height / 16))} disabled style={{
          width: '100%', height: '100%', background: '#FFF', boxSizing: 'border-box',
          border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
          boxShadow: 'inset 1px 1px 0 #404040, inset -1px -1px 0 #D4D0C8',
          font: fontCSS,
        }} />
      );
    } else {
      content = <ComboBox text={text} fontCSS={fontCSS} />;
    }
  } else if (cn === 'ScrollBar') {
    content = <ScrollBar isVert={!!(s & 0x01)} />;
  } else if (cn.toLowerCase() === 'msctls_progress32') {
    content = <Progress percent={40} />;
  } else if (cn.toLowerCase() === 'msctls_updown32') {
    content = <UpDown isHorz={!!(s & 0x0040)} />;
  } else if (cn.toLowerCase() === 'msctls_trackbar32') {
    content = <Trackbar style={s} width={width} height={height} />;
  } else if (cn.toLowerCase() === 'syslistview32') {
    content = <ListView style={s} width={width} height={height} fontCSS={fontCSS} />;
  } else if (cn.toLowerCase() === 'systreeview32') {
    content = <TreeView style={s} fontCSS={fontCSS} />;
  } else if (cn.toLowerCase() === 'msctls_hotkey32') {
    content = <HotKey fontCSS={fontCSS} />;
  } else if (cn.toLowerCase() === 'richedit20w' || cn.toLowerCase() === 'richedit20a' || cn.toLowerCase() === 'richedit') {
    const hasClientEdge = !!(item.exStyle & 0x200);
    const hasBorder = !!(s & 0x800000);
    const isReadonly = !!(s & 0x0800);
    const isMultiline = !!(s & 0x0004);
    const bg = isReadonly ? '#D4D0C8' : '#FFF';
    content = (
      <Edit
        text={text} fontCSS={fontCSS}
        multiline={isMultiline} readonly={isReadonly}
        sunken={hasClientEdge || hasBorder}
        thinBorder={!hasClientEdge && !hasBorder} bgColor={bg}
      />
    );
  } else {
    wrapExtra.border = '1px dotted #808080';
    content = <span style={{ fontSize: '9px', color: '#808080' }}>{cn}</span>;
  }

  return <div style={{ ...wrapStyle, ...wrapExtra }}>{content}</div>;
}

function DialogView({ dlg, resUrls }: { dlg: DialogTemplate; resUrls: ResUrls }) {
  const pt = (dlg.font && dlg.font.pointSize) || 8;
  const dluX = (v: number) => Math.round(v * pt * 0.75 / 4);
  const dluY = (v: number) => Math.round(v * pt * 1.625 / 8);

  const clientW = dluX(dlg.cx);
  const clientH = dluY(dlg.cy);

  const face = (dlg.font && dlg.font.typeface) || 'MS Sans Serif';
  const fontPx = Math.round(pt * 96 / 72);
  const fontCSS = `${fontPx}px/${fontPx}px "${face}", "Tahoma", sans-serif`;

  const hasCaption = !!(dlg.style & 0x00C00000);
  const hasSysMenu = !!(dlg.style & 0x00080000);
  const hasMin = !!(dlg.style & 0x00020000);
  const hasMax = !!(dlg.style & 0x00010000);
  const hasHelp = !!(dlg.style & 0x2000);

  const iconUrl = resUrls.appIconUrl;

  return (
    <Frame
      title={dlg.title || ''} clientW={clientW} clientH={clientH} fontCSS={fontCSS}
      hasCaption={hasCaption} hasSysMenu={hasSysMenu} hasMin={hasMin} hasMax={hasMax}
      hasHelp={hasHelp} iconUrl={iconUrl}
    >
      {dlg.items.map((item, i) => (
        <DialogItemView key={i} item={item} dluX={dluX} dluY={dluY} fontCSS={fontCSS} resUrls={resUrls} />
      ))}
    </Frame>
  );
}

export function DialogDisplay({ dialogs, resUrls }: DialogDisplayProps) {
  const hasMultipleLangs = new Set(dialogs.map(d => d.languageId)).size > 1;

  return (
    <>
      {dialogs.map((d, i) => {
        const idText = d.name ? `"${d.name}"` : `#${d.id}`;
        const title = d.dialog.title ? ` "${d.dialog.title}"` : '';
        const langBadge = (hasMultipleLangs && d.languageId != null) ? ` [${langName(d.languageId)}]` : '';
        return (
          <div key={i} class="w-full mb-3">
            <div class="text-[11px] text-gray-400 mb-1">
              Dialog {idText}{title}{langBadge} — {d.dialog.items.length} control(s)
            </div>
            <div lang={langToHtmlLang(d.languageId) || undefined}>
              <DialogView dlg={d.dialog} resUrls={resUrls} />
            </div>
          </div>
        );
      })}
    </>
  );
}
