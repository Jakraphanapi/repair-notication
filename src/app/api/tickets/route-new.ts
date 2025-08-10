import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateTicketNumber } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const priority = searchParams.get('priority')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    // Filter by user role
    if (session.user.role === 'USER') {
      where.userId = session.user.id
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [tickets, total] = await Promise.all([
      prisma.repairTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true }
          },
          device: {
            include: {
              model: {
                include: {
                  brand: {
                    include: {
                      company: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: { comments: true }
          }
        }
      }),
      prisma.repairTicket.count({ where })
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching repair tickets:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งซ่อม" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 })
    }

    const {
      title,
      description,
      deviceId,
      priority
    } = await request.json()

    // Validation
    if (!title || !description || !deviceId) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลที่จำเป็น" },
        { status: 400 }
      )
    }

    // Verify device exists
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        model: {
          include: {
            brand: {
              include: {
                company: true
              }
            }
          }
        }
      }
    })

    if (!device) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลอุปกรณ์" },
        { status: 404 }
      )
    }

    // Generate ticket number
    const ticketNumber = generateTicketNumber()

    // Create repair ticket
    const repairTicket = await prisma.repairTicket.create({
      data: {
        ticketNumber,
        title,
        description,
        deviceId,
        userId: session.user.id,
        priority: priority || 'MEDIUM',
        images: [],
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        device: {
          include: {
            model: {
              include: {
                brand: {
                  include: {
                    company: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Create status history
    await prisma.repairStatusHistory.create({
      data: {
        repairTicketId: repairTicket.id,
        toStatus: 'PENDING',
        note: 'สร้างการแจ้งซ่อมใหม่'
      }
    })

    return NextResponse.json(repairTicket)
  } catch (error) {
    console.error("Error creating repair ticket:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างการแจ้งซ่อม" },
      { status: 500 }
    )
  }
}
