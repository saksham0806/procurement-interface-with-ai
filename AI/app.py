from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

class SimpleVendorAI:
    def __init__(self):
        # Weights for different factors
        self.weights = {
            'price': 0.4,        # 40% weight on price
            'delivery': 0.3,     # 30% weight on delivery time
            'compliance': 0.2,   # 20% weight on compliance
            'vendor_history': 0.1 # 10% weight on vendor history
        }
    
    def evaluate_quotes(self, quotes_data, rfp_data):
        """Evaluate vendor quotes using simple mathematical scoring"""
        if not quotes_data:
            return {'error': 'No quotes provided'}
        
        # Analyze each quote
        analyzed_quotes = []
        for quote in quotes_data:
            analysis = self._analyze_single_quote(quote, rfp_data, quotes_data)
            analyzed_quotes.append({**quote, 'ai_analysis': analysis})
        
        # Sort by overall score (descending)
        analyzed_quotes.sort(key=lambda x: x['ai_analysis']['overall_score'], reverse=True)
        
        return {
            'analyzed_quotes': analyzed_quotes,
            'summary': self._generate_summary(analyzed_quotes),
            'recommendations': self._generate_recommendations(analyzed_quotes)
        }
    
    def _analyze_single_quote(self, quote, rfp, all_quotes):
        """Analyze a single quote with mathematical scoring"""
        
        # 1. PRICE ANALYSIS (40% weight)
        price_score = self._calculate_price_score(quote, rfp, all_quotes)
        
        # 2. DELIVERY ANALYSIS (30% weight)
        delivery_score = self._calculate_delivery_score(quote, rfp, all_quotes)
        
        # 3. COMPLIANCE ANALYSIS (20% weight)
        compliance_score = self._calculate_compliance_score(quote, rfp)
        
        # 4. VENDOR HISTORY SIMULATION (10% weight)
        vendor_score = self._simulate_vendor_history_score(quote)
        
        # 5. OVERALL SCORE CALCULATION
        overall_score = (
            price_score * self.weights['price'] +
            delivery_score * self.weights['delivery'] +
            compliance_score * self.weights['compliance'] +
            vendor_score * self.weights['vendor_history']
        )
        
        # 6. GENERATE INSIGHTS
        insights = self._generate_quote_insights(quote, rfp, {
            'price_score': price_score,
            'delivery_score': delivery_score,
            'compliance_score': compliance_score,
            'vendor_score': vendor_score
        })
        
        return {
            'overall_score': round(overall_score, 1),
            'price_score': round(price_score, 1),
            'delivery_score': round(delivery_score, 1),
            'compliance_score': round(compliance_score, 1),
            'vendor_score': round(vendor_score, 1),
            'recommendation': self._get_recommendation(overall_score),
            'risk_level': self._assess_risk_level(overall_score, quote, rfp),
            'insights': insights,
            'price_rank': 0,  # Will be set later
            'delivery_rank': 0,  # Will be set later
            'savings': self._calculate_savings(quote, rfp),
            'confidence': self._calculate_confidence(overall_score)
        }
    
    def _calculate_price_score(self, quote, rfp, all_quotes):
        """Calculate price competitiveness score"""
        quote_price = quote.get('totalPrice', 0)
        rfp_budget = rfp.get('budget', 0)
        
        if not quote_price:
            return 0
        
        # Get price statistics from all quotes
        all_prices = [q.get('totalPrice', 0) for q in all_quotes if q.get('totalPrice', 0) > 0]
        
        if not all_prices:
            return 50
        
        min_price = min(all_prices)
        max_price = max(all_prices)
        avg_price = sum(all_prices) / len(all_prices)
        
        # Score based on position relative to other quotes (50% weight)
        if max_price == min_price:
            relative_score = 100
        else:
            relative_score = 100 - ((quote_price - min_price) / (max_price - min_price)) * 100
        
        # Score based on budget compliance (50% weight)
        if rfp_budget > 0:
            if quote_price <= rfp_budget * 0.8:  # 20% under budget
                budget_score = 100
            elif quote_price <= rfp_budget:  # Within budget
                budget_score = 90 - ((quote_price - rfp_budget * 0.8) / (rfp_budget * 0.2)) * 20
            elif quote_price <= rfp_budget * 1.1:  # Up to 10% over budget
                budget_score = 60 - ((quote_price - rfp_budget) / (rfp_budget * 0.1)) * 30
            else:  # More than 10% over budget
                budget_score = 20
        else:
            budget_score = relative_score
        
        return (relative_score * 0.5 + budget_score * 0.5)
    
    def _calculate_delivery_score(self, quote, rfp, all_quotes):
        """Calculate delivery time competitiveness score"""
        quote_delivery = quote.get('deliveryTime', 0)
        
        if not quote_delivery:
            return 0
        
        # Get delivery statistics from all quotes
        all_deliveries = [q.get('deliveryTime', 0) for q in all_quotes if q.get('deliveryTime', 0) > 0]
        
        if not all_deliveries:
            return 50
        
        min_delivery = min(all_deliveries)
        max_delivery = max(all_deliveries)
        
        # Score based on position relative to other quotes
        if max_delivery == min_delivery:
            relative_score = 100
        else:
            relative_score = 100 - ((quote_delivery - min_delivery) / (max_delivery - min_delivery)) * 100
        
        # Check deadline compliance
        try:
            deadline = datetime.fromisoformat(rfp.get('deadline', '').replace('Z', ''))
            days_until_deadline = (deadline - datetime.now()).days
            
            if quote_delivery <= days_until_deadline * 0.8:  # Well within deadline
                deadline_score = 100
            elif quote_delivery <= days_until_deadline:  # Within deadline
                deadline_score = 80
            elif quote_delivery <= days_until_deadline * 1.2:  # Slightly over deadline
                deadline_score = 40
            else:  # Significantly over deadline
                deadline_score = 10
        except:
            deadline_score = relative_score
        
        return (relative_score * 0.6 + deadline_score * 0.4)
    
    def _calculate_compliance_score(self, quote, rfp):
        """Calculate basic compliance score"""
        score = 100
        
        # Check if quote has required information
        if not quote.get('items') or len(quote.get('items', [])) == 0:
            score -= 25
        
        # Check if terms are provided
        if not quote.get('terms', '').strip():
            score -= 15
        
        # Check price vs budget
        if quote.get('totalPrice', 0) > rfp.get('budget', float('inf')):
            score -= 30
        
        # Check delivery vs deadline
        try:
            deadline = datetime.fromisoformat(rfp.get('deadline', '').replace('Z', ''))
            days_until_deadline = (deadline - datetime.now()).days
            if quote.get('deliveryTime', 0) > days_until_deadline:
                score -= 20
        except:
            pass
        
        return max(0, score)
    
    def _simulate_vendor_history_score(self, quote):
        """Simulate vendor history score (in real implementation, query historical data)"""
        vendor_name = quote.get('vendorId', {}).get('name', '')
        
        # Simple hash-based simulation for consistent results
        vendor_hash = hash(vendor_name) % 100
        
        # Convert to score between 60-95 (realistic vendor ratings)
        base_score = 60 + (vendor_hash * 0.35)
        
        # Add some randomness but keep it consistent per vendor
        np.random.seed(abs(hash(vendor_name)) % 1000)
        adjustment = np.random.normal(0, 5)
        
        return max(40, min(100, base_score + adjustment))
    
    def _generate_quote_insights(self, quote, rfp, scores):
        """Generate human-readable insights for the quote"""
        insights = []
        
        # Price insights
        if scores['price_score'] >= 90:
            insights.append("💰 Excellent price - highly competitive")
        elif scores['price_score'] >= 70:
            insights.append("💵 Good price - within acceptable range")
        elif scores['price_score'] >= 50:
            insights.append("💸 Average price - consider negotiation")
        else:
            insights.append("⚠️ High price - review budget alignment")
        
        # Delivery insights
        if scores['delivery_score'] >= 90:
            insights.append("🚀 Fast delivery - excellent timeline")
        elif scores['delivery_score'] >= 70:
            insights.append("⏰ Good delivery - meets requirements")
        elif scores['delivery_score'] >= 50:
            insights.append("📅 Average delivery - acceptable timeline")
        else:
            insights.append("🐌 Slow delivery - may miss deadlines")
        
        # Vendor insights
        if scores['vendor_score'] >= 85:
            insights.append("⭐ Highly rated vendor - reliable choice")
        elif scores['vendor_score'] >= 70:
            insights.append("👍 Good vendor - solid track record")
        else:
            insights.append("🔍 Consider vendor verification")
        
        # Compliance insights
        if scores['compliance_score'] >= 90:
            insights.append("✅ Fully compliant - meets all requirements")
        elif scores['compliance_score'] < 70:
            insights.append("📋 Some compliance gaps - review needed")
        
        return insights
    
    def _get_recommendation(self, score):
        """Get recommendation based on overall score"""
        if score >= 85:
            return "Highly Recommended"
        elif score >= 70:
            return "Recommended"
        elif score >= 55:
            return "Consider with Caution"
        else:
            return "Not Recommended"
    
    def _assess_risk_level(self, score, quote, rfp):
        """Assess risk level based on various factors"""
        if score >= 80:
            return "Low"
        elif score >= 60:
            return "Medium"
        else:
            return "High"
    
    def _calculate_savings(self, quote, rfp):
        """Calculate potential savings vs budget"""
        quote_price = quote.get('totalPrice', 0)
        budget = rfp.get('budget', 0)
        
        if budget > 0 and quote_price < budget:
            savings = budget - quote_price
            percentage = (savings / budget) * 100
            return {
                'amount': savings,
                'percentage': round(percentage, 1)
            }
        return {'amount': 0, 'percentage': 0}
    
    def _calculate_confidence(self, score):
        """Calculate confidence level for the recommendation"""
        if score >= 80 or score <= 40:
            return "High"
        elif score >= 65 or score <= 55:
            return "Medium"
        else:
            return "Low"
    
    def _generate_summary(self, analyzed_quotes):
        """Generate evaluation summary"""
        if not analyzed_quotes:
            return {}
        
        best_quote = analyzed_quotes[0]
        avg_score = sum(q['ai_analysis']['overall_score'] for q in analyzed_quotes) / len(analyzed_quotes)
        
        # Find best price and delivery
        best_price_quote = min(analyzed_quotes, key=lambda x: x.get('totalPrice', float('inf')))
        best_delivery_quote = min(analyzed_quotes, key=lambda x: x.get('deliveryTime', float('inf')))
        
        return {
            'total_quotes': len(analyzed_quotes),
            'average_score': round(avg_score, 1),
            'best_overall': {
                'vendor': best_quote['vendorId'].get('name', 'Unknown'),
                'score': best_quote['ai_analysis']['overall_score'],
                'price': best_quote.get('totalPrice', 0),
                'delivery': best_quote.get('deliveryTime', 0)
            },
            'best_price': {
                'vendor': best_price_quote['vendorId'].get('name', 'Unknown'),
                'price': best_price_quote.get('totalPrice', 0)
            },
            'fastest_delivery': {
                'vendor': best_delivery_quote['vendorId'].get('name', 'Unknown'),
                'delivery': best_delivery_quote.get('deliveryTime', 0)
            },
            'price_range': {
                'min': min(q.get('totalPrice', 0) for q in analyzed_quotes),
                'max': max(q.get('totalPrice', 0) for q in analyzed_quotes)
            }
        }
    
    def _generate_recommendations(self, analyzed_quotes):
        """Generate strategic recommendations"""
        if not analyzed_quotes:
            return []
        
        recommendations = []
        best_quote = analyzed_quotes[0]
        
        # Top choice recommendation
        recommendations.append({
            'type': 'top_choice',
            'title': '🏆 Recommended Vendor',
            'description': f"{best_quote['vendorId'].get('name', 'Top vendor')} offers the best overall value with {best_quote['ai_analysis']['overall_score']} points",
            'action': 'Award contract to this vendor',
            'priority': 'High'
        })
        
        # Cost analysis
        cheapest = min(analyzed_quotes, key=lambda x: x.get('totalPrice', float('inf')))
        if cheapest != best_quote and cheapest['ai_analysis']['overall_score'] >= 60:
            savings = best_quote.get('totalPrice', 0) - cheapest.get('totalPrice', 0)
            recommendations.append({
                'type': 'cost_saving',
                'title': '💰 Cost Savings Opportunity',
                'description': f"Consider {cheapest['vendorId'].get('name', 'alternative vendor')} to save ${savings:,.0f}",
                'action': 'Negotiate with preferred vendor or consider alternative',
                'priority': 'Medium'
            })
        
        # Delivery optimization
        fastest = min(analyzed_quotes, key=lambda x: x.get('deliveryTime', float('inf')))
        if fastest != best_quote and fastest['ai_analysis']['overall_score'] >= 60:
            time_diff = best_quote.get('deliveryTime', 0) - fastest.get('deliveryTime', 0)
            recommendations.append({
                'type': 'delivery_optimization',
                'title': '🚀 Faster Delivery Available',
                'description': f"{fastest['vendorId'].get('name', 'Alternative vendor')} can deliver {time_diff} days faster",
                'action': 'Consider if faster delivery is critical',
                'priority': 'Medium'
            })
        
        # Risk warning
        high_risk_count = sum(1 for q in analyzed_quotes if q['ai_analysis']['risk_level'] == 'High')
        if high_risk_count > len(analyzed_quotes) * 0.5:
            recommendations.append({
                'type': 'risk_warning',
                'title': '⚠️ Risk Assessment',
                'description': f"{high_risk_count} out of {len(analyzed_quotes)} quotes show high risk factors",
                'action': 'Consider revising requirements or extending deadline',
                'priority': 'High'
            })
        
        return recommendations

# Initialize AI system
vendor_ai = SimpleVendorAI()

# API Routes
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'timestamp': datetime.now().isoformat(),
        'service': 'Simple Vendor AI'
    })

@app.route('/api/ai/analyze-quotes', methods=['POST'])
def analyze_quotes():
    try:
        data = request.get_json()
        quotes = data.get('quotes', [])
        rfp = data.get('rfp', {})
        
        if not quotes:
            return jsonify({'error': 'No quotes provided'}), 400
        
        # Perform AI analysis
        analysis = vendor_ai.evaluate_quotes(quotes, rfp)
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'timestamp': datetime.now().isoformat(),
            'analysis_type': 'Price & Delivery Optimization'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/compare-quotes', methods=['POST'])
def compare_quotes():
    """Quick comparison endpoint for simple price/delivery comparison"""
    try:
        data = request.get_json()
        quotes = data.get('quotes', [])
        
        if not quotes:
            return jsonify({'error': 'No quotes provided'}), 400
        
        comparison = {
            'cheapest': min(quotes, key=lambda x: x.get('totalPrice', float('inf'))),
            'fastest': min(quotes, key=lambda x: x.get('deliveryTime', float('inf'))),
            'price_summary': {
                'min': min(q.get('totalPrice', 0) for q in quotes),
                'max': max(q.get('totalPrice', 0) for q in quotes),
                'avg': sum(q.get('totalPrice', 0) for q in quotes) / len(quotes)
            },
            'delivery_summary': {
                'min': min(q.get('deliveryTime', 0) for q in quotes),
                'max': max(q.get('deliveryTime', 0) for q in quotes),
                'avg': sum(q.get('deliveryTime', 0) for q in quotes) / len(quotes)
            }
        }
        
        return jsonify({
            'success': True,
            'comparison': comparison,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🤖 Simple Vendor AI API Starting...")
    print("📊 Features: Price & Delivery Analysis")
    print("🚀 Server running on http://localhost:5001")
    app.run(debug=True, host='0.0.0.0', port=5001)