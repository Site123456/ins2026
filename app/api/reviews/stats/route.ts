import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MenuItemReview from '@/models/MenuItemReview';

// GET /api/reviews/stats — Get review stats for ALL dishes (used by search page)
export async function GET() {
  try {
    await dbConnect();
    const stats = await MenuItemReview.getAllDishStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Review stats error:', error);
    return NextResponse.json({ stats: {} });
  }
}
