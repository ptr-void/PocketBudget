import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get permissions for push notification!');
      return;
    }
  }
}

export async function scheduleRecurringNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Daily Logging Reminder at 8:00 PM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Did you spend anything today? 📝",
      body: "Don't forget to log your expenses to keep your budget accurate!",
      sound: true,
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });

  // Weekly Wrap-Up every Sunday at 9:00 AM (weekday: 1 is Sunday in expo-notifications)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your Weekly Summary is ready! 📊",
      body: "Tap to see your AI Insights and how you did this week.",
      sound: true,
    },
    trigger: {
      weekday: 1, 
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}

export async function triggerBudgetAlert(remainingBudget, period) {
  const isOver = remainingBudget < 0;
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: isOver ? "Budget Exceeded! 🚨" : "Approaching Limit! ⚠️",
      body: isOver 
        ? `You went over your ${period} budget by ₱${Math.abs(remainingBudget).toFixed(2)}.` 
        : `Careful! You only have ₱${remainingBudget.toFixed(2)} left for your ${period} budget.`,
      sound: true,
    },
    trigger: null,
  });
}
