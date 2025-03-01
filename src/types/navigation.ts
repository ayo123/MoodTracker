export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  MoodEntry: undefined;
  MoodHistory: undefined;
  Analytics: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 