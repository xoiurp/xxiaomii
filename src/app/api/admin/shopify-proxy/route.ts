import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/shopify-admin'; // Import the configured Apollo client
import { gql } from '@apollo/client'; // Import gql

// Basic authentication check (replace with your actual admin auth logic if needed)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAdminAuthenticated(_request: Request): boolean {
  // Placeholder: Implement your actual admin session/token check here
  // For now, let's assume anyone reaching this endpoint is authenticated
  // IMPORTANT: Secure this properly in a real application!
  console.warn("Shopify Proxy Route: Implement proper admin authentication!");
  return true;
}

export async function GET(request: Request) {
  // Check authentication
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Construct the GraphQL query to fetch products
    // Fetching first 5 products with basic fields for demonstration
    const query = `
      query GetProducts {
        products(first: 5) {
          edges {
            node {
              id
              title
              handle
              descriptionHtml
              productType
              vendor
              tags
              createdAt
              updatedAt
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    sku
                    price
                    compareAtPrice
                    inventoryPolicy
                    inventoryQuantity
                  }
                }
              }
              images(first: 5) {
                edges {
                  node {
                    id
                    src
                    altText
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `;

    // Check if adminClient is initialized
    if (!adminClient) {
      console.error('Shopify Admin Client is not initialized.');
      throw new Error('Shopify Admin Client is not initialized. Check Shopify Admin configuration.');
    }

    // Use the adminClient (Apollo Client) to execute the query
    const { data, error, errors } = await adminClient.query({
      query: gql(query), // Wrap the query string with gql
      fetchPolicy: 'no-cache' // Ensure fresh data
    });

    // Handle GraphQL errors
    if (errors) {
      console.error('GraphQL errors fetching from Shopify Admin API:', errors);
      throw new Error(`GraphQL error: ${errors.map(e => e.message).join(', ')}`);
    }
    if (error) {
       console.error('Network or other error fetching from Shopify Admin API:', error);
       throw error; // Rethrow network/other errors
    }


    // Return the raw data part of the response from Shopify
    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error('Error fetching from Shopify Admin API:', error);
    let message = 'Failed to fetch data from Shopify';
    let status = 500;

    if (error instanceof Error) {
      message = error.message;
      // Safely access nested properties
      if (typeof error === 'object' && error !== null && 'networkError' in error) {
        const networkError = (error as { networkError?: { statusCode?: number } }).networkError;
        if (networkError && typeof networkError.statusCode === 'number') {
          status = networkError.statusCode;
        }
      }
    }
    return NextResponse.json({ error: 'Shopify API Error', details: message }, { status });
  }
}
