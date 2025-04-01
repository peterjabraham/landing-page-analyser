# scripts/process_csv.py
import pandas as pd
import sys
import os
import re

def process_csv(input_path, output_path, key_events_name):
    try:
        # Read the CSV file
        df = pd.read_csv(input_path)
        
        # Clean column names (strip whitespace, handle case sensitivity)
        df.columns = [col.strip() for col in df.columns]
        
        # Map possible column variations to standard names
        column_variants = {
            'landing page': 'Landing page',
            'landingpage': 'Landing page',
            'url': 'Landing page',
            'page': 'Landing page',
            
            'sessions': 'Sessions',
            'session': 'Sessions',
            'visits': 'Sessions',
            'traffic': 'Sessions',
            
            'key events': 'Key events',
            'keyevents': 'Key events',
            'events': 'Key events',
            'conversions': 'Key events',
            
            'total revenue': 'Total revenue',
            'totalrevenue': 'Total revenue',
            'revenue': 'Total revenue',
            'sales': 'Total revenue'
        }
        
        # Create a mapping for this specific DataFrame
        mapping = {}
        for col in df.columns:
            col_lower = col.lower()
            if col_lower in column_variants:
                mapping[col] = column_variants[col_lower]
        
        # Apply the mapping
        df = df.rename(columns=mapping)
        
        # Custom rename for Key events column if it exists
        if 'Key events' in df.columns:
            df = df.rename(columns={'Key events': key_events_name})
        
        # Ensure required columns exist
        required_columns = ['Landing page', 'Sessions']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")
        
        # Clean up the data
        # Ensure Sessions is numeric
        df['Sessions'] = pd.to_numeric(df['Sessions'].astype(str).str.replace(',', ''), errors='coerce').fillna(0).astype(int)
        
        # Handle Total revenue column if it exists
        if 'Total revenue' in df.columns:
            # Extract numeric values from Total revenue (handling different currency formats)
            df['Total revenue'] = df['Total revenue'].astype(str).apply(
                lambda x: re.sub(r'[^\d.]', '', x) if re.search(r'\d', x) else '0'
            )
            df['Total revenue'] = pd.to_numeric(df['Total revenue'], errors='coerce').fillna(0)
            
            # Calculate conversion rate
            df['Conversion rate'] = ((df['Total revenue'] > 0).astype(int) / df['Sessions'] * 100).round(2)
            
            # Handle potential division by zero or NaN
            df['Conversion rate'] = df['Conversion rate'].fillna(0)
            
            # Format Conversion rate to 2 decimal places with % symbol
            df['Conversion rate'] = df['Conversion rate'].apply(lambda x: f"{x:.2f}%")
            
            # Format Total revenue with currency symbol
            df['Total revenue'] = df['Total revenue'].apply(lambda x: f"£{x:.2f}")
        else:
            # If no revenue column, create a conversion rate based on key events if available
            key_column = key_events_name if key_events_name in df.columns else None
            if key_column:
                # Try to convert key events to numeric
                df[key_column] = pd.to_numeric(df[key_column].astype(str).str.replace(',', ''), errors='coerce').fillna(0)
                
                # Calculate conversion rate based on events / sessions
                df['Conversion rate'] = (df[key_column] / df['Sessions'] * 100).round(2)
                df['Conversion rate'] = df['Conversion rate'].fillna(0)
                df['Conversion rate'] = df['Conversion rate'].apply(lambda x: f"{x:.2f}%")
                
                # Add placeholder Total revenue column
                df['Total revenue'] = "£0.00"
            else:
                # Both revenue and key events missing, create placeholder columns
                df['Total revenue'] = "£0.00"
                df['Conversion rate'] = "0.00%"
        
        # Format sessions with thousands separator for readability
        df['Sessions'] = df['Sessions'].apply(lambda x: f"{x:,}")
        
        # Write the processed data to the output file
        df.to_csv(output_path, index=False)
        
        return True
    except Exception as e:
        print(f"Error processing CSV: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python process_csv.py <input_path> <output_path> <key_events_name>", file=sys.stderr)
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    key_events_name = sys.argv[3]
    
    success = process_csv(input_path, output_path, key_events_name)
    sys.exit(0 if success else 1)
