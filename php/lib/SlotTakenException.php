<?php

declare(strict_types=1);

namespace Aurel;

use RuntimeException;

/**
 * The slot is already occupied: `booking_slots.slot_start` is UNIQUE and the
 * insert hit it. /api/booking.php turns this into a 409 (never a 500), which is
 * what lib/booking/useBookingSubmit.js reads as the "conflict" kind.
 */
final class SlotTakenException extends RuntimeException
{
}
