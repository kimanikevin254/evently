// import { PrismaService } from '../../src/common/services/prisma.service';
// import { EventController } from './event.controller';
// import { EventService } from './event.service';
// import { UserService } from 'src/user/user.service';
// import { TicketService } from 'src/ticket/ticket.service';

// import { Event as PrismaEvents } from '@prisma/client';

// describe('EventController', () => {
// 	let eventController: EventController;
// 	let eventService: EventService;
// 	let prismaService: PrismaService;
// 	let userService: UserService;
// 	let ticketService: TicketService;

// 	beforeEach(() => {
// 		prismaService = new PrismaService();
// 		userService = new UserService(prismaService);
// 		eventService = new EventService(
// 			prismaService,
// 			userService,
// 			ticketService,
// 		);
// 		ticketService = new TicketService(prismaService, eventService);
// 		eventController = new EventController(eventService);
// 	});

// 	describe('Find all events', () => {
// 		it('should return an array of events', async () => {
// 			// Define mock events
// 			const mockEvents: PrismaEvents[] = [
// 				{
// 					id: '732155b6-99b8-43b8-8bff-f481bede05e4',
// 					name: 'Tech Conference 2024 - Published',
// 					description:
// 						'Annual tech conference featuring speakers from various tech industries.',
// 					imageUrl: null,
// 					startDateTime: new Date('2024-10-01T10:00:00.000Z'),
// 					endDateTime: new Date('2024-10-01T18:00:00.000Z'),
// 					isVirtual: false,
// 					address: '123 Tech Road, Silicon Valley, CA',
// 					capacity: 500,
// 					status: 'PUBLISHED',
// 					ownerId: 'cbb8af72-c925-4d4f-b5f8-a3d9132c8049',
// 					createdAt: new Date('2024-11-04T16:11:53.366Z'),
// 					updatedAt: new Date('2024-11-04T16:15:41.001Z'),
// 				},
// 			];

// 			// Mock the findAll method
// 			jest.spyOn(eventService, 'findAll').mockResolvedValue(mockEvents);

// 			// Call the controller method
// 			const result = await eventController.findAll();

// 			// Check if the result equals the mock data
// 			expect(result).toEqual(mockEvents);
// 			expect(eventService.findAll).toHaveBeenCalled();
// 		});
// 	});
// });
