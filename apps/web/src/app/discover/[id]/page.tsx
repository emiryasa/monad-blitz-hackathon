import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { eventRepository } from "@/lib/events/repository";
import { EventDetail } from "./event-detail";

export async function generateStaticParams() {
  const events = await eventRepository.list();
  return events.map((event) => ({ id: event.id }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await eventRepository.findById(id);

  if (!event) notFound();

  return <AppShell><EventDetail event={event} /></AppShell>;
}
