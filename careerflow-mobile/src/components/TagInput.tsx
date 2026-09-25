import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { X, Plus } from 'lucide-react-native';

interface TagInputProps {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}

export function TagInput({ label, tags, onAdd, onRemove, placeholder }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder || 'Add and press +'}
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          accessible
          accessibilityLabel={label}
          onSubmitEditing={handleAdd}
        />
        <Pressable onPress={handleAdd} hitSlop={8} style={styles.addButton} accessible accessibilityLabel={`Add ${label}`}>
          <Plus size={18} color="#0f4c75" />
        </Pressable>
      </View>
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <Pressable
                onPress={() => onRemove(tag)}
                hitSlop={8}
                accessible
                accessibilityLabel={`Remove ${tag}`}
              >
                <X size={14} color="#64748b" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  addButton: {
    padding: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
});
