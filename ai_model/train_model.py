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

# Updated to target skin types
CLASSES = ['acne', 'combination', 'dry', 'normal', 'oily', 'sensitive']
class_indices = {str(i): name for i, name in enumerate(CLASSES)}

if os.path.exists(DATASET_DIR) and len(os.listdir(DATASET_DIR)) > 0:
    print("Training AI model on real dataset at: {}".format(DATASET_DIR))
    
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
    
    # Save real class indices
    real_indices = {str(v): k for k, v in train_gen.class_indices.items()}
    with open(CLASS_INDICES_PATH, 'w') as f:
        json.dump(real_indices, f)
        
    num_classes = len(train_gen.class_indices)
else:
    print("No dataset folder found. Creating baseline model with default skin types: {}".format(CLASSES))
    num_classes = len(CLASSES)
    with open(CLASS_INDICES_PATH, 'w') as f:
        json.dump(class_indices, f)

# Build MobileNetV2 Transfer Learning Architecture
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.2)(x)
outputs = Dense(num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=outputs)
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

if os.path.exists(DATASET_DIR) and len(os.listdir(DATASET_DIR)) > 0:
    model.fit(train_gen, epochs=5)
else:
    # Train 1 quick synthetic step to generate valid weight file
    dummy_x = np.random.random((8, 224, 224, 3))
    dummy_y = tf.keras.utils.to_categorical(np.random.randint(0, num_classes, size=(8,)), num_classes=num_classes)
    model.fit(dummy_x, dummy_y, epochs=1, batch_size=4)

model.save(MODEL_PATH)
print("\nSuccess! Saved skin type model to: {}".format(MODEL_PATH))
print("Saved class map to: {}".format(CLASS_INDICES_PATH))