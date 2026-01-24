import argparse
import sys
import data_loader # type: ignore
from model import StockPredictor # type: ignore
from strategy import calculate_take_profit # type: ignore

def main():
    parser = argparse.ArgumentParser(description='AI Stock Price Predictor & Take Profit Calculator')
    parser.add_argument('--ticker', type=str, required=True, help='Stock Ticker Symbol (e.g., AAPL)')
    parser.add_argument('--period', type=str, default='2y', help='Data period to download (default: 2y)')
    parser.add_argument('--epochs', type=int, default=20, help='Training epochs (default: 20)')
    
    args = parser.parse_args()
    
    print(f"\n--- AI Stock Predictor for {args.ticker} ---\n")
    
    # 1. Fetch Data
    try:
        df = data_loader.fetch_stock_data(args.ticker, period=args.period)
    except Exception as e:
        print(f"Error fetching data: {e}")
        sys.exit(1)
        
    # 2. Preprocess & Add Indicators
    print("Calculating technical indicators...")
    try:
        df = data_loader.add_technical_indicators(df)
        print(f"Data prepared. {len(df)} data points.")
    except Exception as e:
        print(f"Error processing data: {e}")
        sys.exit(1)

    # 3. Prepare Model
    predictor = StockPredictor(sequence_length=60)
    
    # X, y generation
    X, y = predictor.preprocess_data(df)
    
    # Split Train/Test (Just simple split for this demo)
    split = int(len(X) * 0.9)
    X_train, y_train = X[:split], y[:split]
    X_test, y_test = X[split:], y[split:]
    
    # 4. Train
    # Note: In a real scenario, we'd save the model. Here we retrain for the demo.
    predictor.train(X_train, y_train, epochs=args.epochs)
    
    # 5. Predict Next Move
    print("\nPredicting next price movement...")
    try:
        # We use the FULL dataframe context to predict the *next* unknown step
        # effectively stepping one step into the future from the last known data point
        predicted_price, percent_change = predictor.predict_next_move(df)
        
        current_price = df['Close'].iloc[-1]
        
        # 6. Strategy
        strategy_result = calculate_take_profit(current_price, predicted_price)
        
        print("\n" + "="*40)
        print(f"RESULTS FOR {args.ticker}")
        print("="*40)
        print(f"Current Price:   ${strategy_result['current_price']}")
        print(f"Predicted Price: ${strategy_result['take_profit_price']}")
        print(f"Expected Move:   {strategy_result['expected_percent']}%")
        print(f"Action Signal:   {strategy_result['action']}")
        
        if strategy_result['action'] == "BUY":
            print(f"Suggested Take Profit: ${strategy_result['take_profit_price']}")
        print("="*40 + "\n")
        
    except Exception as e:
        print(f"Error during prediction: {e}")

if __name__ == "__main__":
    main()
