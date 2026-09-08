import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'model')
DATASET_DIR = os.path.join(BASE_DIR, 'dataset')

os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODEL_DIR, 'skin_model.keras')
CLASS_INDICES_PATH = os.path.join(MODEL_DIR, 'class_indices.json')

CLASSES = ['acne', 'combination', 'dry', 'normal', 'oily', 'sensitive']
class_indices = {str(i): name.capitalize() for i, name in enumerate(CLASSES)}

# Verify if valid dataset exists with subfolders
has_real_dataset = (
    os.path.exists(DATASET_DIR) 
    and os.path.isdir(DATASET_DIR) 
    and len([d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))]) >= 2
)

if has_real_dataset:
    print(f"✅ Training AI model on dataset found at: {DATASET_DIR}")
    
    datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        validation_split=0.2
    )
    
    train_gen = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='training'
    )
    
    # Map class index back to label name correctly
    real_indices = {str(v): k.capitalize() for k, v in train_gen.class_indices.items()}
    with open(CLASS_INDICES_PATH, 'w') as f:
        json.dump(real_indices, f, indent=2)
        
    num_classes = len(train_gen.class_indices)
else:
    print(f"⚠️ No dataset found. Saving class map for 6 skin types: {CLASSES}")
    num_classes = len(CLASSES)
    with open(CLASS_INDICES_PATH, 'w') as f:
        json.dump(class_indices, f, indent=2)

# MobileNetV2 Transfer Learning Setup
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False  # Freeze base layers

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.3)(x)
outputs = Dense(num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=outputs)
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

if has_real_dataset:
    # Fine-tune model on real data
    model.fit(train_gen, epochs=8)
    model.save(MODEL_PATH)
    print(f"\n🎉 Saved trained skin model to: {MODEL_PATH}")
else:
    print("⚠️ Dataset not provided. Skipping saving empty untuned weights to avoid static predictions.")

print(f"✅ Class indices stored at: {CLASS_INDICES_PATH}")