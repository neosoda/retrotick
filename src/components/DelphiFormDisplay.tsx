import { useState, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { DfmResult, DfmComponent } from '../lib/pe';
import { langToHtmlLang } from '../lib/lang';
import { formatMnemonic } from '../lib/format';
import { delphiColorToCSS } from '../lib/delphi-colors';
import { dfmProp, dfmFontCSS, dfmFontColor } from '../lib/dfm-helpers';
import { dibToTransparentBlob, parseDfmBitmap } from '../lib/image';
import { Frame } from './win2k/Frame';
import { Button } from './win2k/Button';
import { Checkbox } from './win2k/Checkbox';
import { Radio } from './win2k/Radio';
import { GroupBox } from './win2k/GroupBox';
import { Edit } from './win2k/Edit';
import { ComboBox } from './win2k/ComboBox';
import { ListBox } from './win2k/ListBox';
import { Progress } from './win2k/Progress';
import { TabControl } from './win2k/TabControl';
import type { ResUrls } from './DialogDisplay';

interface DelphiFormDisplayProps {
  forms: DfmResult[];
  resUrls: ResUrls;
  createUrl: (blob: Blob) => string;
}

const NON_VISUAL = new Set([
  'TMainMenu', 'TPopupMenu', 'TTimer', 'TOpenDialog', 'TSaveDialog',
  'TFontDialog', 'TColorDialog', 'TPrintDialog', 'TImageList', 'TActionList',
  'TDataSource', 'TTable', 'TQuery', 'TDatabase', 'TOpenPictureDialog', 'TSavePictureDialog',
  'TFindDialog', 'TReplaceDialog', 'TApplicationEvents', 'TMediaPlayer',
  'TIdHTTP', 'TIdUDPServer', 'TIdTCPClient', 'TIdTCPServer', 'TIdAntiFreeze',
  'TIdUDPClient', 'TIdSMTP', 'TIdPOP3', 'TIdFTP', 'TMenuItem',
]);

function DfmImage({ data, stretch, proportional, createUrl }: {
  data: { binary: Uint8Array };
  stretch?: boolean;
  proportional?: boolean;
  createUrl: (blob: Blob) => string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const parsed = parseDfmBitmap(data.binary);
    if (!parsed || !parsed.blob) return;
    if (parsed.dibData) {
      dibToTransparentBlob(parsed.dibData).then(pngBlob => {
        setSrc(createUrl(pngBlob || parsed.blob));
      });
    } else {
      setSrc(createUrl(parsed.blob));
    }
  }, [data, createUrl]);

  if (!src) return null;

  return (
    <img
      src={src}
      style={stretch
        ? { width: '100%', height: '100%', ...(proportional ? { objectFit: 'contain' } : {}) }
        : { maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }
      }
    />
  );
}

function GlyphButton({ comp, fontCSS, fontColor, createUrl }: {
  comp: DfmComponent;
  fontCSS: string;
  fontColor: string;
  createUrl: (blob: Blob) => string;
}) {
  const p = comp.properties;
  const caption = dfmProp(p, 'Caption', '') as string;
  const isDefault = dfmProp(p, 'Default', false) as boolean;
  const glyphData = dfmProp(p, 'Glyph.Data', null) as { binary: Uint8Array } | null;
  const numGlyphs = dfmProp(p, 'NumGlyphs', 1) as number;
  const [glyphSrc, setGlyphSrc] = useState<string | null>(null);
  const [glyphDims, setGlyphDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    if (!glyphData?.binary) return;
    const parsed = parseDfmBitmap(glyphData.binary);
    if (!parsed?.blob) return;
    if (parsed.width) setGlyphDims({ w: parsed.width, h: parsed.height });
    if (parsed.dibData) {
      const bmpUrl = createUrl(parsed.blob);
      setGlyphSrc(bmpUrl);
      dibToTransparentBlob(parsed.dibData).then(pngBlob => {
        if (pngBlob) setGlyphSrc(createUrl(pngBlob));
      });
    } else {
      setGlyphSrc(createUrl(parsed.blob));
    }
  }, [glyphData, createUrl]);

  if (!glyphSrc) {
    return <Button fontCSS={fontCSS} isDefault={isDefault} fontColor={fontColor}>{formatMnemonic(caption)}</Button>;
  }

  const singleW = numGlyphs > 1 && glyphDims.w > 0 ? Math.floor(glyphDims.w / numGlyphs) : 0;

  return (
    <button style={{
      width: '100%', height: '100%', background: '#D4D0C8', cursor: 'var(--win2k-cursor)',
      ...(isDefault
        ? { border: '1px solid #000', boxShadow: 'inset 1px 1px 0 #FFF, inset -1px -1px 0 #404040, inset 2px 2px 0 #D4D0C8, inset -2px -2px 0 #808080' }
        : { border: '1px solid', borderColor: '#FFF #404040 #404040 #FFF', boxShadow: 'inset 1px 1px 0 #D4D0C8, inset -1px -1px 0 #808080' }),
      font: fontCSS, color: fontColor, padding: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
    }}>
      {singleW > 0 ? (
        <span style={{ display: 'inline-block', width: `${singleW}px`, height: `${glyphDims.h}px`, overflow: 'hidden', flexShrink: 0 }}>
          <img src={glyphSrc} style={{ imageRendering: 'pixelated', flexShrink: 0 }} />
        </span>
      ) : (
        <img src={glyphSrc} style={{ imageRendering: 'pixelated', flexShrink: 0 }} />
      )}
      {caption && <span>{formatMnemonic(caption)}</span>}
    </button>
  );
}

function DelphiControl({ comp, parentProps, parentFontCSS, createUrl }: {
  comp: DfmComponent;
  parentProps: Record<string, unknown>;
  parentFontCSS: string;
  createUrl: (blob: Blob) => string;
}) {
  const p = comp.properties;
  const cn = comp.className;
  const left = dfmProp(p, 'Left', 0) as number;
  const top = dfmProp(p, 'Top', 0) as number;
  const width = dfmProp(p, 'Width', 75) as number;
  const height = dfmProp(p, 'Height', 25) as number;
  const caption = dfmProp(p, 'Caption', '') as string;
  const text = dfmProp(p, 'Text', caption) as string;
  const enabled = dfmProp(p, 'Enabled', true) as boolean;
  const visible = dfmProp(p, 'Visible', true) as boolean;
  const color = delphiColorToCSS(dfmProp(p, 'Color', null));
  const fontCSS = ('Font.Name' in p || 'Font.Height' in p || 'Font.Size' in p)
    ? dfmFontCSS(p) : parentFontCSS;
  const fontColor = dfmFontColor(p);

  const align = dfmProp(p, 'Align', '') as string;

  let wrapStyle: Record<string, string | number | undefined>;
  if (align === 'alTop') {
    wrapStyle = { position: 'absolute', left: 0, top: `${top}px`, width: '100%', height: `${height}px` };
  } else if (align === 'alBottom') {
    wrapStyle = { position: 'absolute', left: 0, bottom: 0, width: '100%', height: `${height}px` };
  } else if (align === 'alClient') {
    wrapStyle = { position: 'absolute', left: 0, top: `${top}px`, width: '100%', bottom: 0 };
  } else {
    wrapStyle = { position: 'absolute', left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` };
  }
  wrapStyle.font = fontCSS;
  wrapStyle.color = fontColor;
  if (enabled === false) wrapStyle.opacity = 0.5;
  if (visible === false) wrapStyle.display = 'none';

  let content: ComponentChildren = null;
  const extra: Record<string, string | number | undefined> = {};

  if (cn === 'TButton') {
    content = <Button fontCSS={fontCSS} isDefault={dfmProp(p, 'Default', false) as boolean} fontColor={fontColor}>{formatMnemonic(caption)}</Button>;
  } else if (cn === 'TBitBtn' || cn === 'TSpeedButton') {
    content = <GlyphButton comp={comp} fontCSS={fontCSS} fontColor={fontColor} createUrl={createUrl} />;
  } else if (cn === 'TLabel') {
    const alignment = dfmProp(p, 'Alignment', 'taLeftJustify') as string;
    const ta = alignment === 'taCenter' ? 'center' : alignment === 'taRightJustify' ? 'right' : 'left';
    const wrap = dfmProp(p, 'WordWrap', false) as boolean;
    content = (
      <span style={{ display: 'block', width: '100%', height: '100%', textAlign: ta, overflow: 'hidden', whiteSpace: wrap ? 'normal' : 'nowrap' }}>
        {formatMnemonic(caption)}
      </span>
    );
  } else if (cn === 'TEdit' || cn === 'TMaskEdit') {
    const ro = dfmProp(p, 'ReadOnly', false) as boolean;
    content = (
      <Edit
        text={text} fontCSS={fontCSS} fontColor={fontColor}
        password={!!dfmProp(p, 'PasswordChar', '')}
        readonly={ro} sunken bgColor={ro ? '#D4D0C8' : '#FFF'}
      />
    );
  } else if (cn === 'TSpinEdit') {
    const val = dfmProp(p, 'Value', 0) as number;
    content = (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        <input type="text" readOnly value={String(val)} style={{
          flex: 1, minWidth: 0, boxSizing: 'border-box', background: '#FFF',
          border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
          boxShadow: 'inset 1px 1px 0 #404040, inset -1px -1px 0 #D4D0C8',
          font: fontCSS, color: fontColor, padding: '1px 2px', outline: 'none',
        }} />
        <div style={{ width: '16px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          {['\u25B2', '\u25BC'].map(ch => (
            <div key={ch} style={{
              flex: 1, background: '#D4D0C8', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid', borderColor: '#FFF #404040 #404040 #FFF',
              boxShadow: 'inset 1px 1px 0 #D4D0C8, inset -1px -1px 0 #808080',
              font: '8px/1 sans-serif', color: '#000', cursor: 'var(--win2k-cursor)',
            }}>{ch}</div>
          ))}
        </div>
      </div>
    );
  } else if (cn === 'TMemo' || cn === 'TRichEdit') {
    const lines = dfmProp(p, 'Lines.Strings', null);
    const memoText = Array.isArray(lines) ? (lines as string[]).join('\n') : '';
    content = <Edit text={memoText} fontCSS={fontCSS} fontColor={fontColor} multiline sunken bgColor="#FFF" />;
  } else if (cn === 'TCheckBox') {
    const checked = (dfmProp(p, 'Checked', false) as boolean) || (dfmProp(p, 'State', '') === 'cbChecked');
    content = <Checkbox fontCSS={fontCSS} checked={checked}>{formatMnemonic(caption)}</Checkbox>;
  } else if (cn === 'TRadioButton') {
    content = <Radio fontCSS={fontCSS} checked={dfmProp(p, 'Checked', false) as boolean}>{formatMnemonic(caption)}</Radio>;
  } else if (cn === 'TPanel') {
    const bevelOuter = dfmProp(p, 'BevelOuter', 'bvRaised') as string;
    const bg = color || '#D4D0C8';
    if (bevelOuter === 'bvRaised') {
      extra.border = '1px solid'; extra.borderColor = '#FFF #808080 #808080 #FFF';
    } else if (bevelOuter === 'bvLowered') {
      extra.border = '1px solid'; extra.borderColor = '#808080 #FFF #FFF #808080';
    } else {
      extra.border = 'none';
    }
    extra.background = bg;
    extra.overflow = 'hidden';
    const panelAlign = dfmProp(p, 'Alignment', 'taCenter') as string;
    const ta = panelAlign === 'taLeftJustify' ? 'flex-start' : panelAlign === 'taRightJustify' ? 'flex-end' : 'center';
    content = (
      <>
        {caption && (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: ta, width: '100%', height: '100%' }}>
            {formatMnemonic(caption)}
          </span>
        )}
        {comp.children.map((child, i) => (
          <DelphiControl key={i} comp={child} parentProps={p} parentFontCSS={fontCSS} createUrl={createUrl} />
        ))}
      </>
    );
  } else if (cn === 'TGroupBox') {
    if (color) extra.background = color;
    content = (
      <GroupBox label={formatMnemonic(caption)} fontCSS={fontCSS} bgColor={color}>
        {comp.children.map((child, i) => (
          <DelphiControl key={i} comp={child} parentProps={p} parentFontCSS={fontCSS} createUrl={createUrl} />
        ))}
      </GroupBox>
    );
  } else if (cn === 'TComboBox') {
    content = <ComboBox text={text} fontCSS={fontCSS} fontColor={fontColor} />;
  } else if (cn === 'TListBox' || cn === 'TCheckListBox') {
    content = <ListBox fontCSS={fontCSS} />;
  } else if (cn === 'TListView' || cn === 'TTreeView') {
    extra.background = '#FFF';
    extra.border = '1px solid';
    extra.borderColor = '#808080 #FFF #FFF #808080';
    extra.boxShadow = 'inset 1px 1px 0 #404040, inset -1px -1px 0 #D4D0C8';
  } else if (cn === 'TProgressBar') {
    const pos = dfmProp(p, 'Position', 40) as number;
    const max = dfmProp(p, 'Max', 100) as number;
    content = <Progress percent={Math.round(pos / max * 100)} />;
  } else if (cn === 'TStatusBar') {
    extra.background = '#D4D0C8';
    extra.borderTop = '1px solid #808080';
    extra.display = 'flex';
    extra.alignItems = 'center';
    const panels = dfmProp(p, 'Panels', null) as { collection?: Record<string, unknown>[] } | null;
    if (panels?.collection) {
      content = panels.collection.map((panel, i) => {
        const pw = dfmProp(panel, 'Width', 50) as number;
        return (
          <span key={i} style={{
            display: 'inline-block', width: `${pw}px`, padding: '0 4px', overflow: 'hidden',
            whiteSpace: 'nowrap', border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
            marginRight: '1px',
          }}>
            {dfmProp(panel, 'Text', '') as string}
          </span>
        );
      });
    } else {
      content = (
        <span style={{ flex: 1, padding: '0 4px', border: '1px solid', borderColor: '#808080 #FFF #FFF #808080' }}>
          {dfmProp(p, 'SimpleText', '') as string}
        </span>
      );
    }
  } else if (cn === 'TPageControl') {
    extra.background = '#D4D0C8';
    extra.overflow = 'visible';
    const tabs = comp.children.filter(c => c.className === 'TTabSheet');
    const activeName = dfmProp(p, 'ActivePage', '') as string;
    let activeIdx = tabs.findIndex(t => t.name === activeName);
    if (activeIdx < 0) activeIdx = 0;
    const tabItems = tabs.map(tab => ({ text: dfmProp(tab.properties, 'Caption', tab.name) as string }));
    content = (
      <TabControl tabs={tabItems} selectedIndex={activeIdx} font={fontCSS} height={height}>
        {tabs.length > 0 && tabs[activeIdx].children.map((child, i) => (
          <DelphiControl key={i} comp={child} parentProps={tabs[activeIdx].properties} parentFontCSS={fontCSS} createUrl={createUrl} />
        ))}
      </TabControl>
    );
  } else if (cn === 'TTabSheet') {
    extra.background = color || '#D4D0C8';
    content = comp.children.map((child, i) => (
      <DelphiControl key={i} comp={child} parentProps={p} parentFontCSS={fontCSS} createUrl={createUrl} />
    ));
  } else if (cn === 'TScrollBox') {
    extra.background = color || '#D4D0C8';
    extra.overflow = 'hidden';
    extra.border = '1px solid';
    extra.borderColor = '#808080 #FFF #FFF #808080';
    extra.boxShadow = 'inset 1px 1px 0 #404040, inset -1px -1px 0 #D4D0C8';
    content = comp.children.map((child, i) => (
      <DelphiControl key={i} comp={child} parentProps={p} parentFontCSS={fontCSS} createUrl={createUrl} />
    ));
  } else if (cn === 'TBevel') {
    const shape = dfmProp(p, 'Shape', 'bsBox') as string;
    if (shape === 'bsTopLine' || shape === 'bsBottomLine') {
      wrapStyle.height = '2px';
      extra.borderTop = '1px solid #808080';
      extra.borderBottom = '1px solid #FFF';
    } else if (shape === 'bsLeftLine' || shape === 'bsRightLine') {
      wrapStyle.width = '2px';
      extra.borderLeft = '1px solid #808080';
      extra.borderRight = '1px solid #FFF';
    } else if (shape !== 'bsSpacer') {
      extra.border = '1px solid';
      extra.borderColor = '#808080 #FFF #FFF #808080';
    }
  } else if (cn === 'TSplitter') {
    extra.background = '#D4D0C8';
    extra.cursor = (dfmProp(p, 'Align', '') as string) === 'alLeft' ? 'col-resize' : 'row-resize';
  } else if (cn === 'TTrackBar') {
    const isVert = (dfmProp(p, 'Orientation', '') as string) === 'trVertical';
    extra.display = 'flex';
    extra.alignItems = 'center';
    extra.justifyContent = 'center';
    const track = (
      <div style={{
        ...(isVert
          ? { width: '4px', height: '80%' }
          : { width: '80%', height: '4px' }),
        background: '#FFF',
        border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
      }} />
    );
    const thumb = (
      <div style={{
        position: 'absolute', width: '11px', height: '21px', background: '#D4D0C8',
        border: '1px solid', borderColor: '#FFF #404040 #404040 #FFF',
        boxShadow: 'inset 1px 1px 0 #D4D0C8, inset -1px -1px 0 #808080',
        left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      }} />
    );
    content = <>{track}{thumb}</>;
  } else if (cn === 'TImage') {
    const picData = dfmProp(p, 'Picture.Data', null) as { binary: Uint8Array } | null;
    if (picData?.binary) {
      const stretch = dfmProp(p, 'Stretch', false) as boolean;
      const proportional = dfmProp(p, 'Proportional', false) as boolean;
      content = <DfmImage data={picData} stretch={stretch} proportional={proportional} createUrl={createUrl} />;
    } else {
      extra.border = '1px dotted #808080';
    }
  } else if (cn === 'TJvGIFAnimator') {
    const imgData = dfmProp(p, 'Image.Data', null) as { binary: Uint8Array } | null;
    if (imgData?.binary) {
      // Try standard format first, then JVCL u32 size + raw GIF
      let parsed = parseDfmBitmap(imgData.binary);
      if (!parsed && imgData.binary.length >= 10) {
        const b = imgData.binary;
        const size = b[0] | (b[1] << 8) | (b[2] << 16) | ((b[3] << 24) >>> 0);
        if (size + 4 <= b.length && b[4] === 0x47 && b[5] === 0x49 && b[6] === 0x46) {
          parsed = { blob: new Blob([b.subarray(4, 4 + size) as BlobPart], { type: 'image/gif' }), width: 0, height: 0, bitCount: 0, magentaIndex: -1 };
        }
      }
      if (parsed?.blob) {
        const url = createUrl(parsed.blob);
        const stretch = dfmProp(p, 'Stretch', false) as boolean;
        content = <img src={url} style={stretch ? { width: '100%', height: '100%' } : { maxWidth: '100%', maxHeight: '100%' }} />;
      } else {
        extra.border = '1px dotted #808080';
      }
    } else {
      extra.border = '1px dotted #808080';
    }
  } else if (cn === 'TPaintBox') {
    extra.border = '1px dotted #808080';
  } else if (cn === 'TToolBar') {
    wrapStyle.background = '#D4D0C8';
    wrapStyle.display = 'flex';
    wrapStyle.alignItems = 'center';
    wrapStyle.gap = '1px';
    wrapStyle.padding = '1px';
    wrapStyle.borderBottom = '1px solid #808080';
    content = comp.children.map((child, i) => {
      if (child.className === 'TToolButton') {
        const tbw = dfmProp(child.properties, 'Width', 23) as number;
        const tbStyle = dfmProp(child.properties, 'Style', 'tbsButton') as string;
        if (tbStyle === 'tbsSeparator' || tbStyle === 'tbsDivider') {
          return (
            <div key={i} style={{
              width: `${tbw}px`, height: '80%', borderLeft: '1px solid #808080',
              borderRight: '1px solid #FFF', margin: '0 2px',
            }} />
          );
        }
        return (
          <div key={i} style={{
            width: `${tbw}px`, height: `${height - 4}px`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid transparent', cursor: 'var(--win2k-cursor)',
            font: '12px/1 "Tahoma",sans-serif',
          }}>
            {dfmProp(child.properties, 'Caption', '') as string}
          </div>
        );
      }
      return null;
    });
  } else {
    if (comp.children.length > 0) {
      extra.overflow = 'hidden';
      if (color) extra.background = color;
      content = comp.children.map((child, i) => (
        <DelphiControl key={i} comp={child} parentProps={p} parentFontCSS={fontCSS} createUrl={createUrl} />
      ));
    } else {
      extra.border = '1px dotted #808080';
      content = <span style={{ fontSize: '9px', color: '#808080' }}>{cn}</span>;
    }
  }

  return <div style={{ ...wrapStyle, ...extra }}>{content}</div>;
}

function DelphiFormView({ form, resUrls, createUrl }: {
  form: DfmComponent;
  resUrls: ResUrls;
  createUrl: (blob: Blob) => string;
}) {
  const p = form.properties;
  const clientW = dfmProp(p, 'ClientWidth', dfmProp(p, 'Width', 400)) as number;
  const clientH = dfmProp(p, 'ClientHeight', dfmProp(p, 'Height', 300)) as number;
  const caption = dfmProp(p, 'Caption', form.name) as string;
  const bgColor = delphiColorToCSS(dfmProp(p, 'Color', 'clBtnFace')) || '#D4D0C8';
  const fontCSS = dfmFontCSS(p);

  const bs = dfmProp(p, 'BorderStyle', 'bsSizeable') as string;
  const hasMin = bs === 'bsSizeable' || bs === 'bsSizeToolWin';
  const hasMax = bs === 'bsSizeable';

  // Resolve title bar icon
  const [iconUrl, setIconUrl] = useState<string | null>(resUrls.appIconUrl);
  useEffect(() => {
    const iconData = dfmProp(p, 'Icon.Data', null) as { binary: Uint8Array } | null;
    if (iconData?.binary) {
      const parsed = parseDfmBitmap(iconData.binary);
      if (parsed?.blob) {
        setIconUrl(createUrl(parsed.blob));
      }
    }
  }, [p, createUrl]);

  const mainMenu = form.children.find(c => c.className === 'TMainMenu');
  const menuBarItems = mainMenu
    ? mainMenu.children.map(mi => ({
        content: formatMnemonic(dfmProp(mi.properties, 'Caption', mi.name) as string),
      }))
    : null;

  return (
    <Frame
      title={caption} clientW={clientW} clientH={clientH} fontCSS={fontCSS}
      bgColor={bgColor} hasCaption hasSysMenu hasMin={hasMin} hasMax={hasMax}
      menuBarItems={menuBarItems} iconUrl={iconUrl}
    >
      {form.children.map((child, i) => {
        if (NON_VISUAL.has(child.className)) return null;
        return <DelphiControl key={i} comp={child} parentProps={p} parentFontCSS={fontCSS} createUrl={createUrl} />;
      })}
    </Frame>
  );
}

export function DelphiFormDisplay({ forms, resUrls, createUrl }: DelphiFormDisplayProps) {
  return (
    <>
      {forms.map((f, i) => {
        const idText = f.name ? `"${f.name}"` : `#${f.id}`;
        return (
          <div key={i} class="w-full mb-3">
            <div class="text-[11px] text-gray-400 mb-1">
              {f.form.className} {idText} "{f.form.name}"
            </div>
            <div lang={langToHtmlLang(f.languageId) || undefined}>
              <DelphiFormView form={f.form} resUrls={resUrls} createUrl={createUrl} />
            </div>
          </div>
        );
      })}
    </>
  );
}
