import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { medicationService, Medication } from '../../services/medicationService';

export const ManageMedicationsScreen = ({ navigation }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMedication, setCurrentMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  // Load medications when component mounts
  useEffect(() => {
    loadMedications();
  }, []);

  // Function to load medications from service
  const loadMedications = async () => {
    try {
      setLoading(true);
      const data = await medicationService.getMedications();
      setMedications(data);
    } catch (error) {
      console.error('Failed to load medications:', error);
      Alert.alert('Error', 'Failed to load your medications');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for adding a new medication
  const openAddModal = () => {
    // Reset form fields
    setName('');
    setDosage('');
    setFrequency('');
    setTime('');
    setNotes('');
    setCurrentMedication(null);
    setModalVisible(true);
  };

  // Open modal for editing a medication
  const openEditModal = (medication: Medication) => {
    setName(medication.name);
    setDosage(medication.dosage);
    setFrequency(medication.frequency);
    setTime(medication.time || '');
    setNotes(medication.notes || '');
    setCurrentMedication(medication);
    setModalVisible(true);
  };

  // Close modal and reset form
  const closeModal = () => {
    setModalVisible(false);
  };

  // Save the medication (add new or update existing)
  const handleSaveMedication = async () => {
    // Validate form
    if (!name || !dosage || !frequency) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (currentMedication) {
        // Update existing medication
        const updatedMedication = {
          ...currentMedication,
          name,
          dosage,
          frequency,
          time,
          notes
        };
        
        await medicationService.updateMedication(updatedMedication);
        
        // Update local state
        setMedications(prevMeds => 
          prevMeds.map(med => med.id === updatedMedication.id ? updatedMedication : med)
        );
      } else {
        // Add new medication
        const newMedication = await medicationService.addMedication({
          name,
          dosage,
          frequency,
          time,
          notes
        });
        
        // Update local state
        setMedications(prevMeds => [...prevMeds, newMedication]);
      }
      
      // Close modal after saving
      closeModal();
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'Failed to save medication');
    }
  };

  // Delete a medication
  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationService.deleteMedication(id);
              
              // Update local state after successful deletion
              setMedications(medications.filter(med => med.id !== id));
              
              // If the deleted medication was being edited, close the modal
              if (currentMedication?.id === id) {
                closeModal();
              }
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('Error', 'Failed to delete medication');
            }
          }
        }
      ]
    );
  };

  // Render an individual medication item
  const renderItem = ({ item }: { item: Medication }) => (
    <View style={styles.medicationItem}>
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName}>{item.name}</Text>
        <Text style={styles.medicationDetails}>{item.dosage} - {item.frequency}</Text>
        {item.time && <Text style={styles.medicationTime}>Time: {item.time}</Text>}
        {item.notes && <Text style={styles.medicationNotes}>{item.notes}</Text>}
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with title and add button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Medications</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      ) : (
        /* Medications list */
        medications.length > 0 ? (
          <FlatList
            data={medications}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No medications added yet</Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={openAddModal}
            >
              <Text style={styles.emptyAddButtonText}>Add Your First Medication</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {/* Done button */}
      <TouchableOpacity 
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>

      {/* Add/Edit Medication Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentMedication ? 'Edit Medication' : 'Add New Medication'}
            </Text>
            
            <ScrollView>
              <Text style={styles.inputLabel}>Medication Name*</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Lithium"
                value={name}
                onChangeText={setName}
              />
              
              <Text style={styles.inputLabel}>Dosage*</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 300mg"
                value={dosage}
                onChangeText={setDosage}
              />
              
              <Text style={styles.inputLabel}>Frequency*</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Twice daily"
                value={frequency}
                onChangeText={setFrequency}
              />
              
              <Text style={styles.inputLabel}>Time (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 9:00 AM, 9:00 PM"
                value={time}
                onChangeText={setTime}
              />
              
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Any special instructions or notes"
                value={notes}
                onChangeText={setNotes}
                multiline={true}
                numberOfLines={4}
              />
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveMedication}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textLight,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContainer: {
    paddingBottom: 80, // Space for the done button
  },
  medicationItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  medicationTime: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 2,
  },
  medicationNotes: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 20,
  },
  emptyAddButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyAddButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  doneButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '500',
    fontSize: 16,
  },
}); 