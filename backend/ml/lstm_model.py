import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Embedding, Dropout
import os

class RouteSequenceLSTM:
    def __init__(self, vocab_size, embedding_dim=32, lstm_units=64):
        self.vocab_size = vocab_size
        self.model = Sequential([
            Embedding(input_dim=vocab_size, output_dim=embedding_dim),
            LSTM(lstm_units, return_sequences=True),
            Dropout(0.2),
            LSTM(lstm_units),
            Dense(vocab_size, activation='softmax')
        ])
        self.model.compile(loss='sparse_categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

    def train(self, X_train, y_train, epochs=10, batch_size=16):
        self.model.fit(np.array(X_train), np.array(y_train), epochs=epochs, batch_size=batch_size, verbose=1)

    def predict_next_stop(self, sequence):
        """Predicts the next logical stop given a sequence."""
        # sequence shape: (1, seq_length)
        prediction = self.model.predict(np.array([sequence]))
        return np.argmax(prediction, axis=-1)[0]

    def save_model(self, path):
        self.model.save(path)

    def load_model(self, path):
        if os.path.exists(path):
            self.model = load_model(path)
