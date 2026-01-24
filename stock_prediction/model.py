import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential # type: ignore
from tensorflow.keras.layers import LSTM, Dense, Dropout # type: ignore
from sklearn.preprocessing import MinMaxScaler

class StockPredictor:
    def __init__(self, sequence_length=60):
        self.sequence_length = sequence_length
        self.model = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))

    def preprocess_data(self, df):
        """
        Prepares data for LSTM: Scales and creates sequences.
        """
        # We focus on the 'Close' price and indicators. 
        # For simplicity in this demo, predicting 'Close' based on 'Close' and indicators.
        # But to reverse transform easily, let's target 'Close'.
        
        feature_cols = ['Close', 'SMA_10', 'SMA_50', 'RSI', 'MACD']
        data = df[feature_cols].values
        
        # Scale data
        scaled_data = self.scaler.fit_transform(data)
        
        X, y = [], []
        for i in range(self.sequence_length, len(scaled_data)):
            X.append(scaled_data[i-self.sequence_length:i])
            y.append(scaled_data[i, 0]) # Target is 'Close' which is at index 0
            
        return np.array(X), np.array(y)

    def build_model(self, input_shape):
        model = Sequential()
        model.add(LSTM(units=50, return_sequences=True, input_shape=input_shape))
        model.add(Dropout(0.2))
        model.add(LSTM(units=50, return_sequences=False))
        model.add(Dropout(0.2))
        model.add(Dense(units=1)) # Prediction of next scaled Close price
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        self.model = model

    def train(self, X_train, y_train, epochs=25, batch_size=32):
        if self.model is None:
            self.build_model((X_train.shape[1], X_train.shape[2]))
        
        print("Training model...")
        self.model.fit(X_train, y_train, epochs=epochs, batch_size=batch_size, verbose=1)

    def predict_next_move(self, df):
        """
        Predicts the percentage move for the next step.
        """
        if self.model is None:
            raise Exception("Model not trained yet.")

        # Prepare last sequence
        feature_cols = ['Close', 'SMA_10', 'SMA_50', 'RSI', 'MACD']
        last_sequence_data = df[feature_cols].tail(self.sequence_length).values
        
        # Scale using the *already fitted* scaler (DO NOT FIT AGAIN)
        # Note: In production, we'd need to handle new data carefully. 
        # Here we assume df is the same context or we refit scaler if it's a new run.
        # For a single run script, using the same scaler instance is fine if the flow is linear.
        
        scaled_seq = self.scaler.transform(last_sequence_data)
        X_input = np.array([scaled_seq])
        
        # Predict
        predicted_scaled_price = self.model.predict(X_input)
        
        # Inverse transform
        # We need to construct a dummy row to inverse transform because scaler expects 5 features
        dummy_row = np.zeros((1, len(feature_cols)))
        dummy_row[0, 0] = predicted_scaled_price[0, 0]
        
        # Inverse transform partial is tricky with standard scaler. 
        # A trick is to copy the last inputs and replace the target column.
        last_input_scaled = X_input[0, -1, :].copy() 
        last_input_scaled[0] = predicted_scaled_price[0, 0] # Replace Close with prediction
        
        predicted_price = self.scaler.inverse_transform([last_input_scaled])[0, 0]
        
        current_price = df['Close'].iloc[-1]
        percent_change = ((predicted_price - current_price) / current_price) * 100
        
        return predicted_price, percent_change
