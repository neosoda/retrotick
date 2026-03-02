/** Shared Windows XP-like visual styles */

export const xpTheme = {
  desktop: {
    background: 'linear-gradient(180deg, #8ec8ff 0%, #6ab2f6 33%, #4f96e8 100%)',
  },
  taskbar: {
    background: 'linear-gradient(to bottom, #3a93ff, #1f6fdf)',
    borderTop: '#7fc3ff',
  },
  taskButton: {
    activeBackground: 'linear-gradient(to bottom, #2f7fe2, #225fb9)',
    inactiveBackground: 'linear-gradient(to bottom, #4fa4ff, #2f7fe2)',
    activeBorder: '#194a99 #72beff #72beff #194a99',
    inactiveBorder: '#9cd2ff #1c59ad #1c59ad #9cd2ff',
  },
  startButton: {
    inactiveBackground: 'linear-gradient(to bottom, #4cc34f, #2a8f2d)',
    activeBackground: 'linear-gradient(to bottom, #3a8fff, #2a64d5)',
    inactiveBorder: '#9de59f #1e6621 #1e6621 #9de59f',
    activeBorder: '#1f4e9b #70b5ff #70b5ff #1f4e9b',
  },
  tray: {
    background: 'linear-gradient(to bottom, #4fa4ff, #2f7fe2)',
    border: '#6fb8ff #1f60b9 #1f60b9 #6fb8ff',
  },
  window: {
    frameBg: '#ece9d8',
    frameShadow: 'inset 1px 1px 0 #fff, inset -1px -1px 0 #7f9db9, 0 0 0 1px #0054e3',
    focusedCaption: 'linear-gradient(to bottom, #0a4fdd, #3d95ff)',
    unfocusedCaption: 'linear-gradient(to bottom, #7a96df, #9db9ed)',
    captionText: '#FFF',
  },
  button: {
    background: '#ece9d8',
    border: '#003c74',
    defaultBorder: '#002d59',
    highlight: '#ffffff',
    shadow: '#7f9db9',
    activeBg: '#d8def2',
  },
} as const;

/** Disabled/grayed text: gray foreground with 1px white embossed shadow */
export const disabledTextStyle = {
  color: '#808080',
  textShadow: '1px 1px 0 #FFF',
} as const;
