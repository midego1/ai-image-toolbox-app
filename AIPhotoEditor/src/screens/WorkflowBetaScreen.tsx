import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { SettingsNavigationProp } from '../types/navigation';
import { TEST_WORKFLOWS, WorkflowConfig } from '../types/workflow';
import { SafeAreaView } from 'react-native-safe-area-context';

const WorkflowBetaScreen = () => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const navigation = useNavigation<SettingsNavigationProp<'WorkflowBeta'>>();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const startWorkflow = (workflow: WorkflowConfig) => {
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please select or capture an image first');
      return;
    }

    // Navigate to the main Processing screen with workflow params
    (navigation as any).navigate('Processing', {
      imageUri: selectedImage,
      editMode: workflow.steps[0].editMode, // Use first step's mode as primary
      workflow: workflow,
    });
  };

  const renderWorkflowCard = (workflow: WorkflowConfig) => {
    const totalTime = workflow.steps.reduce((sum, step) => sum + step.estimatedTimeMs, 0);
    const totalTimeSeconds = Math.floor(totalTime / 1000);

    return (
      <TouchableOpacity
        key={workflow.id}
        style={[
          styles.workflowCard,
          {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: workflow.isPremium ? colors.primary : colors.border,
          }
        ]}
        onPress={() => startWorkflow(workflow)}
        activeOpacity={0.7}
      >
        {workflow.isPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }]}>
            <Ionicons name="star" size={12} color={colors.background} />
            <Text style={[styles.premiumText, { color: colors.background, fontSize: typography.size.xs, marginLeft: 4 }]}>
              PREMIUM
            </Text>
          </View>
        )}

        <Text style={[styles.workflowName, { color: colors.text, fontSize: typography.size.lg, fontWeight: '700', marginTop: workflow.isPremium ? spacing.sm : 0 }]}>
          {workflow.name}
        </Text>

        <Text style={[styles.workflowDescription, { color: colors.textSecondary, fontSize: typography.size.sm, marginTop: spacing.xs }]}>
          {workflow.description}
        </Text>

        {/* Steps */}
        <View style={[styles.stepsContainer, { marginTop: spacing.md }]}>
          <Text style={[styles.stepsLabel, { color: colors.textSecondary, fontSize: typography.size.xs, fontWeight: '600', marginBottom: spacing.xs }]}>
            STEPS ({workflow.steps.length}):
          </Text>

          <View style={styles.stepsFlow}>
            {workflow.steps.map((step, index) => (
              <View key={step.id} style={styles.stepFlowItem}>
                <View style={[styles.stepBubble, { backgroundColor: colors.primary + '20', borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }]}>
                  <Text style={[styles.stepText, { color: colors.primary, fontSize: typography.size.xs }]}>
                    {step.displayName}
                  </Text>
                </View>
                {index < workflow.steps.length - 1 && (
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={colors.textSecondary}
                    style={{ marginHorizontal: spacing.xs }}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Metadata */}
        <View style={[styles.metadata, { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center' }]}>
          <View style={styles.metadataItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.metadataText, { color: colors.textSecondary, fontSize: typography.size.xs, marginLeft: spacing.xs }]}>
              ~{totalTimeSeconds}s
            </Text>
          </View>

          <View style={[styles.metadataItem, { marginLeft: spacing.lg }]}>
            <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.metadataText, { color: colors.textSecondary, fontSize: typography.size.xs, marginLeft: spacing.xs }]}>
              {workflow.steps.length} steps
            </Text>
          </View>
        </View>

        {/* Start Button */}
        <LinearGradient
          colors={workflow.isPremium ? [colors.primary, colors.primary + 'CC'] : [colors.surface, colors.surface]}
          style={[styles.startButton, { borderRadius: 12, marginTop: spacing.md }]}
        >
          <TouchableOpacity
            onPress={() => startWorkflow(workflow)}
            style={[styles.startButtonInner, { padding: spacing.md }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.startButtonText, { color: workflow.isPremium ? colors.background : colors.text, fontSize: typography.size.base, fontWeight: '600' }]}>
              Start Workflow
            </Text>
            <Ionicons
              name="play"
              size={18}
              color={workflow.isPremium ? colors.background : colors.text}
              style={{ marginLeft: spacing.sm }}
            />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: spacing.lg }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text, fontSize: typography.size.xxl, fontWeight: '700' }]}>
              Multi-Step Workflows
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.size.base, marginTop: spacing.xs }]}>
              Beta Testing - Chain multiple AI tools together
            </Text>
          </View>
        </View>

        {/* Image Selection */}
        <View style={[styles.imageSection, { marginTop: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.lg, fontWeight: '600', marginBottom: spacing.md }]}>
            Select Image
          </Text>

          {selectedImage ? (
            <View style={styles.selectedImageContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={[styles.selectedImage, { borderRadius: 12, borderWidth: 2, borderColor: colors.border }]}
              />
              <TouchableOpacity
                style={[styles.changeImageButton, { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: colors.surface, borderRadius: 20, padding: spacing.sm }]}
                onPress={pickImage}
              >
                <Ionicons name="pencil" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', padding: spacing.xl }]}>
              <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.placeholderText, { color: colors.textSecondary, fontSize: typography.size.base, marginTop: spacing.md, textAlign: 'center' }]}>
                No image selected
              </Text>
              <View style={[styles.imageButtons, { flexDirection: 'row', marginTop: spacing.lg }]}>
                <TouchableOpacity
                  style={[styles.imageButton, { backgroundColor: colors.primary, borderRadius: 12, padding: spacing.md, flex: 1, marginRight: spacing.sm }]}
                  onPress={pickImage}
                >
                  <Ionicons name="images" size={20} color={colors.background} />
                  <Text style={[styles.imageButtonText, { color: colors.background, fontSize: typography.size.sm, marginTop: spacing.xs }]}>
                    Gallery
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, flex: 1, marginLeft: spacing.sm }]}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={20} color={colors.text} />
                  <Text style={[styles.imageButtonText, { color: colors.text, fontSize: typography.size.sm, marginTop: spacing.xs }]}>
                    Camera
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Workflows */}
        <View style={[styles.workflowsSection, { marginTop: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.lg, fontWeight: '600', marginBottom: spacing.md }]}>
            Available Workflows
          </Text>

          {TEST_WORKFLOWS.map(workflow => renderWorkflowCard(workflow))}
        </View>

        {/* Beta Info */}
        <View style={[styles.betaInfo, { backgroundColor: colors.primary + '10', borderRadius: 12, padding: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.xl }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="flask" size={24} color={colors.primary} />
            <Text style={[styles.betaTitle, { color: colors.primary, fontSize: typography.size.base, fontWeight: '700', marginLeft: spacing.md }]}>
              Beta Feature
            </Text>
          </View>
          <Text style={[styles.betaText, { color: colors.text, fontSize: typography.size.sm, marginTop: spacing.sm, lineHeight: 20 }]}>
            This is an experimental feature. Multi-step workflows allow you to chain multiple AI transformations together. Each step uses the output of the previous step as input.
          </Text>
          <Text style={[styles.betaText, { color: colors.text, fontSize: typography.size.sm, marginTop: spacing.sm, lineHeight: 20 }]}>
            • Processing time is cumulative{'\n'}
            • Each step is saved individually{'\n'}
            • You can view all intermediate results{'\n'}
            • Failed steps can be retried
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {},
  subtitle: {},
  imageSection: {},
  sectionTitle: {},
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
  },
  changeImageButton: {},
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {},
  imageButtons: {},
  imageButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtonText: {},
  workflowsSection: {},
  workflowCard: {
    position: 'relative',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontWeight: '700',
  },
  workflowName: {},
  workflowDescription: {},
  stepsContainer: {},
  stepsLabel: {},
  stepsFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  stepFlowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepBubble: {},
  stepText: {
    fontWeight: '600',
  },
  metadata: {},
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {},
  startButton: {},
  startButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {},
  betaInfo: {},
  betaTitle: {},
  betaText: {},
});

export default WorkflowBetaScreen;
