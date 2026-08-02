import { createStyles, keyframes } from 'antd-style';

export const fadeInAnimation = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const useStyles = createStyles(({ token }) => ({
  lang: {
    width: 42,
    height: 42,
    lineHeight: '42px',
    position: 'fixed',
    right: 16,
    borderRadius: token.borderRadius,
    ':hover': {
      backgroundColor: token.colorBgTextHover,
    },
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'auto',
    backgroundImage:
      "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
    backgroundSize: '100% 100%',
  },
  loginFormExtra: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotPassword: {
    color: token.colorPrimary,
    cursor: 'pointer',
    transition: `color ${token.motionDurationMid} ${token.motionEaseInOut}`,
    ':hover': {
      color: token.colorPrimaryHover,
      textDecoration: 'underline',
    },
  },
  verifySection: {
    marginTop: 8,
    opacity: 0,
    animation: `${fadeInAnimation} ${token.motionDurationSlow} ${token.motionEaseInOut} forwards`,
  },
  verifyHint: {
    color: token.colorTextSecondary,
    marginBottom: 16,
    fontSize: 14,
  },
  otpInput: {
    justifyContent: 'center',
    marginBottom: 24,
  },
  oidcSection: {
    marginTop: 24,
  },
  oidcDivider: {
    color: token.colorTextSecondary,
    fontSize: 13,
  },
  oidcButton: {
    width: '100%',
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  verifyIcon: {
    fontSize: 40,
    color: token.colorPrimary,
    marginBottom: 12,
  },
}));
