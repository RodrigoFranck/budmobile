import { StyleSheet } from 'react-native';
import { LayoutSpacing } from '@/constants/layout';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // --background dark
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: LayoutSpacing.authPadding.horizontal,
    paddingVertical: 40,
  },
  content: {
    width: '100%',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF', // --foreground
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#B5B5B5', // --muted-foreground
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A', // --card
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#1E1E1E', // --background
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#B5B5B5', // --muted-foreground
  },
  tabTextActive: {
    color: '#FFFFFF', // --foreground
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF', // --foreground
  },
  forgotPassword: {
    fontSize: 14,
    color: '#bee3db', // --accent
  },
  input: {
    height: 52,
    backgroundColor: '#2A2A2A', // --input/--card
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF', // --foreground
    borderWidth: 1,
    borderColor: '#333333', // --border
  },
  button: {
    height: 52,
    backgroundColor: '#FFFFFF', // --primary (dark mode)
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1E1E', // --primary-foreground (dark mode)
  },
});


