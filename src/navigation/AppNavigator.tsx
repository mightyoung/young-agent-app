import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../features/auth/stores/authStore';
import { useSettingsStore } from '../features/profile/stores/settingsStore';
import { initializeAIService } from '../features/ai/services/init';
import { initDatabase } from '../core/storage/database';
import { initializeStorage } from '../core/storage/mmkv';
import { colors } from '../core/constants/colors';
import { ThemeProvider, useTheme } from '../../constants/themeV2';
import { QueryProvider } from '../shared/api/QueryProvider';

// Auth screens
import SplashScreen from '../features/auth/screens/SplashScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';

// Home screens
import CameraScreen from '../features/camera/screens/CameraScreen';
import HomeScreen from '../features/camera/screens/HomeScreen';
import ScanCheckScreen from '../features/inspection/screens/ScanCheckScreen';
import SafetyCheckScreen from '../features/inspection/screens/SafetyCheckScreen';
import InspectionResultScreen from '../features/inspection/screens/InspectionResultScreen';
import HazardReportScreen from '../features/hazard/screens/HazardReportScreen';
import HazardResultScreen from '../features/hazard/screens/HazardResultScreen';
import CameraEntryScreen from '../features/hazard/screens/CameraEntryScreen';
import InspectionHistoryScreen from '../features/inspection/screens/InspectionHistoryScreen';
import InspectionDetailScreen from '../features/inspection/screens/InspectionDetailScreen';
import HazardListScreen from '../features/hazard/screens/HazardListScreen';
import HazardDetailScreen from '../features/hazard/screens/HazardDetailScreen';
import DeviceListScreen from '../features/device/screens/DeviceListScreen';
import DeviceDetailScreen from '../features/device/screens/DeviceDetailScreen';
import MessagesScreen from '../features/message/screens/MessagesScreen';
import SettingsScreen from '../features/profile/screens/SettingsScreen';

// AI screens
import AIAssistantScreen from '../features/ai/screens/AIAssistantScreen';
import AIDataCenterScreen from '../features/ai/screens/AIDataCenterScreen';
import AIProfileScreen from '../features/ai/screens/AIProfileScreen';
import StatisticsScreen from '../features/ai/screens/StatisticsScreen';
import KnowledgeBaseScreen from '../features/ai/screens/KnowledgeBaseScreen';
import KnowledgeDetailScreen from '../features/ai/screens/KnowledgeDetailScreen';

import { RootStackParamList, AuthStackParamList, MainTabParamList, AITabParamList } from '../types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AITab = createBottomTabNavigator<AITabParamList>();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Splash" component={SplashScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

// AI Tab Navigator - Always use Grok style (black-white theme)
const AITabNavigator = () => {
  // Grok style colors (always black-white)
  const grokColors = {
    primary: '#FFFFFF',
    tabInactive: '#666666',
  };

  return (
  <AITab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#000000',
        borderTopColor: '#333333',
        borderTopWidth: 1,
      },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'AIAssistant') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'AIDataCenter') {
          iconName = focused ? 'folder' : 'folder-outline';
        } else if (route.name === 'AIProfile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: grokColors.primary,
      tabBarInactiveTintColor: grokColors.tabInactive,
      tabBarLabelStyle: {
        color: '#FFFFFF',
        fontSize: 12,
      },
    })}
  >
    <AITab.Screen
      name="AIAssistant"
      component={AIAssistantScreen}
      options={{ tabBarLabel: 'AI助手' }}
    />
    <AITab.Screen
      name="AIDataCenter"
      component={AIDataCenterScreen}
      options={{ tabBarLabel: '台账管理' }}
    />
    <AITab.Screen
      name="AIProfile"
      component={AIProfileScreen}
      options={{ tabBarLabel: '个人中心' }}
    />
  </AITab.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { display: 'none' },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'AI') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else {
          iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.tabInactive,
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarLabel: '首页' }}
    />
    <Tab.Screen
      name="AI"
      component={AITabNavigator}
      options={{ tabBarLabel: 'AI助手' }}
    />
  </Tab.Navigator>
);

// Deep linking configuration for web testing
const linking = {
  prefixes: ['http://localhost:8082', 'http://localhost:8081', 'mightyoungapp://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Splash: 'splash',
          Login: 'login',
          BindEnterprise: 'bind-enterprise/:userId',
        },
      },
      Main: {
        screens: {
          Home: 'home',
          AI: {
            screens: {
              AIAssistant: 'ai',
              AIDataCenter: 'ai/data-center',
              AIProfile: 'ai/profile',
            },
          },
        },
      },
      Camera: 'camera',
      CameraEntry: 'camera-entry',
      ScanCheck: 'scan-check/:deviceId',
      HazardReport: 'hazard-report',
      HazardResult: 'hazard-result/:hazardId',
      SafetyCheck: 'safety-check/:taskId',
      InspectionResult: 'inspection-result/:recordId',
      InspectionHistory: 'inspection-history',
      InspectionDetail: 'inspection-detail/:id',
      HazardList: 'hazard-list',
      HazardDetail: 'hazard-detail/:id',
      HazardConfirm: 'hazard-confirm/:id',
      HazardRectify: 'hazard-rectify/:id',
      HazardAccept: 'hazard-accept/:id',
      DeviceList: 'device-list',
      DeviceDetail: 'device-detail/:id',
      DeviceChecklist: 'device-checklist/:deviceId',
      Messages: 'messages',
      HazardReview: 'hazard-review',
      TaskAssign: 'task-assign',
      Settings: 'settings',
      AISettings: 'ai-settings',
      BackendSettings: 'backend-settings',
      Statistics: 'statistics',
      KnowledgeBase: 'knowledge-base',
      KnowledgeDetail: 'knowledge-detail',
    },
  },
};

// Expose test login for browser console
if (typeof window !== 'undefined') {
  (window as any).testLogin = () => {
    const { testLogin } = useAuthStore.getState();
    testLogin();
  };
}

// Root Navigator
const RootNavigator = () => {
  const { isLoggedIn, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainNavigator} />
          <RootStack.Screen name="Camera" component={HomeScreen} />
          <RootStack.Screen name="ScanCheck" component={ScanCheckScreen} />
          <RootStack.Screen name="SafetyCheck" component={SafetyCheckScreen} />
          <RootStack.Screen name="InspectionResult" component={InspectionResultScreen} />
          <RootStack.Screen name="HazardReport" component={HazardReportScreen} />
          <RootStack.Screen name="CameraEntry" component={CameraEntryScreen} />
          <RootStack.Screen name="HazardResult" component={HazardResultScreen} />
          <RootStack.Screen name="InspectionHistory" component={InspectionHistoryScreen} />
          <RootStack.Screen name="InspectionDetail" component={InspectionDetailScreen} />
          <RootStack.Screen name="HazardList" component={HazardListScreen} />
          <RootStack.Screen name="HazardDetail" component={HazardDetailScreen} />
          <RootStack.Screen name="DeviceList" component={DeviceListScreen} />
          <RootStack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
          <RootStack.Screen name="Messages" component={MessagesScreen} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
          <RootStack.Screen name="Statistics" component={StatisticsScreen} />
          <RootStack.Screen name="KnowledgeBase" component={KnowledgeBaseScreen} />
          <RootStack.Screen name="KnowledgeDetail" component={KnowledgeDetailScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
};

// Main App Navigator
function AppNavigatorContent() {
  const [isDbReady, setIsDbReady] = useState(false);
  const initialize = useAuthStore((state) => state.initialize);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const { isDark } = useTheme();

  useEffect(() => {
    // Simplified initialization - don't wait for everything
    const init = async () => {
      try {
        // Initialize storage (loads cached data in React Native)
        initializeStorage().catch(e => console.warn('Storage init error:', e));

        // Initialize database (in-memory, fast)
        initDatabase().catch(e => console.warn('DB init error:', e));

        // Initialize auth (load saved user)
        initialize();

        // Load settings
        loadSettings();

        // Initialize AI service
        initializeAIService().catch(e => console.warn('AI init error:', e));

        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsDbReady(true); // Continue anyway
      }

      // Fallback - ensure we always proceed after 3 seconds
      setTimeout(() => {
        setIsDbReady(true);
      }, 3000);
    };

    init();
  }, []);

  if (!isDbReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// 包装后的AppNavigator，带有ThemeProvider和QueryProvider
export default function AppNavigator() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AppNavigatorContent />
      </ThemeProvider>
    </QueryProvider>
  );
}
