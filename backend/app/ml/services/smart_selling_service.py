class SmartSellingService:
    @classmethod
    def recommend(
        cls, crop_name: str, expected_yield_kg: float, current_market_price_per_kg: float,
        storage_cost_per_day: float, expected_price_trend: str
    ):
        immediate_revenue = expected_yield_kg * current_market_price_per_kg
        holding_periods = [15, 30, 45]
        holding_details = []
        
        best_net_profit = immediate_revenue
        best_holding_days = 0
        trend = expected_price_trend.upper().strip()

        # Simulate different storage holding periods
        for days in holding_periods:
            # Price multiplier projections based on trend analysis
            if trend == "UP":
                price_mult = 1.0 + (0.005 * days) # +7.5% at 15d, +15% at 30d, +22.5% at 45d
            elif trend == "DOWN":
                price_mult = 1.0 - (0.004 * days) # -6% at 15d, -12% at 30d, -18% at 45d
            else:
                price_mult = 1.0 # Stable price

            projected_price = current_market_price_per_kg * price_mult
            storage_cost = storage_cost_per_day * days
            projected_rev = expected_yield_kg * projected_price
            net_profit = projected_rev - storage_cost

            holding_details.append({
                "holding_days": days,
                "projected_price_per_kg": round(projected_price, 2),
                "storage_cost": round(storage_cost, 2),
                "projected_revenue": round(projected_rev, 2),
                "net_profit": round(net_profit, 2)
            })

            if net_profit > best_net_profit:
                best_net_profit = net_profit
                best_holding_days = days

        # Formulate final advice recommendation
        if best_holding_days > 0:
            recommendation = f"HOLD. Storing your crop for {best_holding_days} days is projected to maximize net profit to ₹{best_net_profit:,.2f} (after covering storage fees)."
        else:
            recommendation = "SELL NOW. Market price trends and storage costs indicate that holding the crop will diminish net profit margins."

        return {
            "recommendation": recommendation,
            "immediate_revenue": round(immediate_revenue, 2),
            "holding_details": holding_details
        }
