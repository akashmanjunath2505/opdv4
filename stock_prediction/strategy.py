def calculate_take_profit(current_price, predicted_price):
    """
    Calculates the Take Profit level based on the prediction.
    
    Args:
        current_price (float): The current stock price.
        predicted_price (float): The predicted stock price.
        
    Returns:
        dict: Contains 'action', 'take_profit_price', 'expected_percent'
    """
    percent_change = ((predicted_price - current_price) / current_price) * 100
    
    # Simple logic: If prediction is positive, set TP at predicted price.
    # If negative, we might still output the prediction but signal 'HOLD' or 'SELL'.
    
    action = "BUY" if percent_change > 0 else "SELL/HOLD"
    
    return {
        "action": action,
        "take_profit_price": round(predicted_price, 2),
        "expected_percent": round(percent_change, 2),
        "current_price": round(current_price, 2)
    }
