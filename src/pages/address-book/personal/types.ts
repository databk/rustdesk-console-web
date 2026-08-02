export interface PersonalAddressBookProps {
  guid?: string;
  title?: string;
  onBack?: () => void;
  canWrite?: boolean;
}