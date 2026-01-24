import yfinance as yf
import pandas as pd
import numpy as np

def fetch_stock_data(ticker, period="2y"):
    """
    Fetches historical stock data for the given ticker.
    Args:
        ticker (str): Stock symbol (e.g., 'AAPL')
        period (str): Data period to download (default '2y')
    Returns:
        pd.DataFrame: DataFrame with historical data
    """
    print(f"Fetching data for {ticker}...")
    data = yf.download(ticker, period=period, progress=False)
    if data.empty:
        raise ValueError(f"No data found for ticker {ticker}")
    return data

def add_technical_indicators(df):
    """
    Adds technical indicators (RSI, MACD, SMA) to the DataFrame.
    """
    df = df.copy()
    
    # Ensure MultiIndex columns are handled if yfinance returns them
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    # Simple Moving Average (SMA)
    df['SMA_10'] = df['Close'].rolling(window=10).mean()
    df['SMA_50'] = df['Close'].rolling(window=50).mean()

    # RSI (Relative Strength Index)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))

    # MACD (Moving Average Convergence Divergence)
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = exp1 - exp2
    df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()

    # Drop NaNs created by rolling windows
    df.dropna(inplace=True)
    
    return df
