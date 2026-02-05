import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert utility that works on both web and mobile
 */

export const showAlert = (title: string, message: string, onOk?: () => void | Promise<void>) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (onOk) {
      Promise.resolve(onOk()).catch(console.error);
    }
  } else {
    Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
  }
};

export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  onCancel?: () => void | Promise<void>,
  confirmText: string = 'Confirmer',
  cancelText: string = 'Annuler'
) => {
  if (Platform.OS === 'web') {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result) {
      Promise.resolve(onConfirm()).catch(console.error);
    } else if (onCancel) {
      Promise.resolve(onCancel()).catch(console.error);
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: onCancel },
      { text: confirmText, onPress: onConfirm },
    ]);
  }
};

export const showDestructiveConfirm = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  onCancel?: () => void | Promise<void>,
  confirmText: string = 'Confirmer',
  cancelText: string = 'Annuler'
) => {
  if (Platform.OS === 'web') {
    const result = window.confirm(`⚠️ ${title}\n\n${message}`);
    if (result) {
      Promise.resolve(onConfirm()).catch(console.error);
    } else if (onCancel) {
      Promise.resolve(onCancel()).catch(console.error);
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: onCancel },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
  }
};
