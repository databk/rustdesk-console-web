import { useModel } from '@umijs/max';

const useIsDark = (): boolean => {
  const { initialState } = useModel('@@initialState');
  return initialState?.settings?.navTheme === 'realDark';
};

export default useIsDark;
