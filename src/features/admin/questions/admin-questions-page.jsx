"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleIcon, XIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  answerAdminQuestion,
  deleteAdminQuestion,
  getAdminQuestionDetail,
  getAdminQuestions,
  getAdminQuestionStatusOptions,
  moderateAdminQuestion,
} from "@/features/admin/questions/admin-questions-api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

function formatDate(value, locale) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBadgeVariant(status) {
  if (status === "published" || status === "answered") {
    return "success";
  }

  if (status === "rejected" || status === "hidden") {
    return "error";
  }

  return "warning";
}

function QuestionDetailPanel({ questionId, onClose, onUpdated }) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [state, setState] = useState({
    loading: true,
    error: null,
    question: null,
  });
  const [dialog, setDialog] = useState({
    open: false,
    action: "publish",
    reason: "",
    note: "",
  });
  const [answerForm, setAnswerForm] = useState({
    answer: "",
    moderationNote: "",
    publicVisible: true,
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!questionId) {
      return undefined;
    }

    let active = true;

    async function load() {
      setState({
        loading: true,
        error: null,
        question: null,
      });

      try {
        const question = await getAdminQuestionDetail(questionId);

        if (active) {
          setState({
            loading: false,
            error: null,
            question,
          });
          setAnswerForm({
            answer: question.answer ?? "",
            moderationNote: question.moderationNote ?? "",
            publicVisible: question.availableActions.publicVisible,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            question: null,
          });
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [questionId]);

  async function runAction(action) {
    if (!state.question) {
      return;
    }

    startTransition(async () => {
      try {
        const nextQuestion =
          action === "delete"
            ? await deleteAdminQuestion(state.question).then(() => null)
            : await moderateAdminQuestion(state.question, action, {
                rejectionReason: dialog.reason,
                moderationNote: dialog.note,
              });
        setDialog({
          open: false,
          action: "publish",
          reason: "",
          note: "",
        });
        if (nextQuestion) {
          setState({
            loading: false,
            error: null,
            question: nextQuestion,
          });
        }
        onUpdated?.(action, nextQuestion ?? state.question);
        toast.success(
          t(action === "publish" ? "published" : action === "reject" ? "rejected" : action === "hide" ? "hidden" : "productDeleted"),
          t("moderationUpdatedDescription"),
        );
        if (action === "delete") {
          onClose?.();
        }
      } catch (error) {
        toast.apiError(error, t("moderation"));
      }
    });
  }

  function handleAnswerSubmit(event) {
    event.preventDefault();

    if (!state.question) {
      return;
    }

    startTransition(async () => {
      try {
        const nextQuestion = await answerAdminQuestion(state.question, answerForm);
        setState({
          loading: false,
          error: null,
          question: nextQuestion,
        });
        onUpdated?.("answer", nextQuestion);
        toast.success(t("answered"), t("answerUpdatedDescription"));
      } catch (error) {
        toast.apiError(error, t("answerQuestion"));
      }
    });
  }

  if (!questionId) {
    return null;
  }

  const question = state.question;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end bg-brand-navy/35 backdrop-blur-sm">
        <button type="button" className="hidden flex-1 lg:block" onClick={onClose} />
        <aside className="flex h-full w-full max-w-[34rem] flex-col overflow-y-auto bg-white shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-5 py-4 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("moderation")}</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">{t("productQuestions")}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={t("closePanel")}
              >
                <XIcon className="size-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-5 px-5 py-5">
            {state.loading ? (
              <Card className="space-y-4 rounded-[1.75rem]">
                <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
                <div className="h-24 animate-pulse rounded-[1.5rem] bg-muted" />
                <div className="h-32 animate-pulse rounded-[1.5rem] bg-muted" />
              </Card>
            ) : null}

            {state.error ? (
              <Alert variant="warning" title={t("failedToLoad")}>
                {t("adminQuestionsLoadError")}
              </Alert>
            ) : null}

            {question ? (
              <>
                <Card className="space-y-4 rounded-[1.75rem]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{question.productName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{question.customerName}</p>
                    </div>
                    <Badge variant={getBadgeVariant(question.status)}>{t(question.status)}</Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("date")}</p>
                      <p className="mt-1 font-medium text-foreground">{formatDate(question.createdAt, locale)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("answered")}</p>
                      <p className="mt-1 font-medium text-foreground">{question.answer ? t("answered") : t("unanswered")}</p>
                    </div>
                  </div>
                </Card>

                <Card className="space-y-4 rounded-[1.75rem]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("question")}</p>
                    <p className="mt-1 text-sm leading-7 text-foreground">{question.question}</p>
                  </div>
                  {question.vehicleContext ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("vehicleCompatibilityContext")}</p>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">{question.vehicleContext}</p>
                    </div>
                  ) : null}
                  {question.rejectionReason ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("rejectionReason")}</p>
                      <p className="mt-1 text-sm text-foreground">{question.rejectionReason}</p>
                    </div>
                  ) : null}
                </Card>

                <Card className="space-y-4 rounded-[1.75rem]">
                  <h3 className="text-lg font-semibold text-foreground">{t("answerQuestion")}</h3>
                  <form className="space-y-4" onSubmit={handleAnswerSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="question-answer">{t("answer")}</Label>
                      <Textarea
                        id="question-answer"
                        className="min-h-28"
                        value={answerForm.answer}
                        onChange={(event) => setAnswerForm((current) => ({ ...current, answer: event.target.value }))}
                      />
                    </div>
                    {question.supportsModerationNote ? (
                      <div className="space-y-2">
                        <Label htmlFor="question-note">{t("moderationNote")}</Label>
                        <Textarea
                          id="question-note"
                          value={answerForm.moderationNote}
                          onChange={(event) =>
                            setAnswerForm((current) => ({ ...current, moderationNote: event.target.value }))
                          }
                        />
                      </div>
                    ) : null}
                    {question.supportsPublicAnswerToggle ? (
                      <label className="flex items-center gap-3 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={answerForm.publicVisible}
                          onChange={(event) =>
                            setAnswerForm((current) => ({ ...current, publicVisible: event.target.checked }))
                          }
                        />
                        {t("customerVisible")}
                      </label>
                    ) : null}
                    <Button
                      type="submit"
                      disabled={isPending || !answerForm.answer.trim()}
                    >
                      {isPending ? t("saving") : question.answer ? t("updateAnswer") : t("answerQuestion")}
                    </Button>
                  </form>
                </Card>
              </>
            ) : null}
          </div>

          {question ? (
            <div className="sticky bottom-0 border-t border-border bg-white px-5 py-4">
              <div className="flex flex-wrap gap-3">
                {question.availableActions.canPublish ? (
                  <Button onClick={() => setDialog({ open: true, action: "publish", reason: "", note: "" })}>
                    {t("publish")}
                  </Button>
                ) : null}
                {question.availableActions.canReject ? (
                  <Button
                    variant="warning"
                    onClick={() => setDialog({ open: true, action: "reject", reason: "", note: "" })}
                  >
                    {t("reject")}
                  </Button>
                ) : null}
                {question.availableActions.canHide ? (
                  <Button
                    variant="outline"
                    onClick={() => setDialog({ open: true, action: "hide", reason: "", note: "" })}
                  >
                    {t("hide")}
                  </Button>
                ) : null}
                {question.availableActions.canDelete ? (
                  <Button
                    variant="danger"
                    onClick={() => setDialog({ open: true, action: "delete", reason: "", note: "" })}
                  >
                    {t("deleteQuestion")}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <ConfirmationDialog
        open={dialog.open}
        title={
          dialog.action === "publish"
            ? t("publish")
            : dialog.action === "reject"
              ? t("reject")
              : dialog.action === "hide"
                ? t("hide")
                : t("deleteQuestion")
        }
        description={t("moderationConfirmation")}
        confirmLabel={isPending ? t("saving") : t(dialog.action === "delete" ? "deleteQuestion" : dialog.action)}
        cancelLabel={t("cancel")}
        onConfirm={() => runAction(dialog.action)}
        onCancel={() => setDialog({ open: false, action: "publish", reason: "", note: "" })}
        tone={dialog.action === "delete" ? "destructive" : dialog.action === "reject" ? "warning" : "info"}
        reasonLabel={dialog.action === "reject" ? t("rejectionReason") : question?.supportsModerationNote ? t("moderationNote") : undefined}
        reasonPlaceholder={dialog.action === "reject" ? t("enterRejectionReason") : t("internalNotePlaceholder")}
        reasonValue={dialog.action === "reject" ? dialog.reason : dialog.note}
        onReasonChange={(value) =>
          setDialog((current) =>
            current.action === "reject"
              ? { ...current, reason: value }
              : { ...current, note: value },
          )
        }
      />
    </>
  );
}

function QuestionsTable({ items, t, locale, onOpen }) {
  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-3">{t("product")}</th>
            <th className="pb-3">{t("customer")}</th>
            <th className="pb-3">{t("question")}</th>
            <th className="pb-3">{t("answer")}</th>
            <th className="pb-3">{t("status")}</th>
            <th className="pb-3">{t("date")}</th>
            <th className="pb-3">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((question) => (
            <tr key={question.id} className="border-b border-border/70 align-top last:border-b-0">
              <td className="py-4">
                <p className="font-semibold text-foreground">{question.productName}</p>
              </td>
              <td className="py-4 text-muted-foreground">{question.customerName}</td>
              <td className="py-4 text-muted-foreground">{question.questionSummary}</td>
              <td className="py-4 text-muted-foreground">{question.answer ? t("answered") : t("unanswered")}</td>
              <td className="py-4">
                <Badge variant={getBadgeVariant(question.status)}>{t(question.status)}</Badge>
              </td>
              <td className="py-4 text-muted-foreground">{formatDate(question.createdAt, locale)}</td>
              <td className="py-4">
                <Button size="sm" variant="outline" onClick={() => onOpen(question.id)}>
                  {t("viewDetails")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestionsCards({ items, t, locale, onOpen }) {
  return (
    <div className="grid gap-4 xl:hidden">
      {items.map((question) => (
        <Card key={question.id} className="space-y-4 rounded-[1.75rem]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-foreground">{question.productName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{question.customerName}</p>
            </div>
            <Badge variant={getBadgeVariant(question.status)}>{t(question.status)}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("answer")}</p>
              <p className="mt-1 font-medium text-foreground">{question.answer ? t("answered") : t("unanswered")}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("date")}</p>
              <p className="mt-1 font-medium text-foreground">{formatDate(question.createdAt, locale)}</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{question.questionSummary}</p>
          <Button onClick={() => onOpen(question.id)}>{t("viewDetails")}</Button>
        </Card>
      ))}
    </div>
  );
}

export function AdminQuestionsPage() {
  const auth = useAuth();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    product: "",
    answered: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
  });
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
    pagination: null,
  });
  const [selectedQuestionId, setSelectedQuestionId] = useState("");

  useEffect(() => {
    if (auth.isLoading) {
      return undefined;
    }

    const access = getAdminAccessState(auth.session);

    if (!access.isAuthenticated) {
      router.replace(routes.admin.adminLogin);
      return undefined;
    }

    if (access.forbidden) {
      auth.logout().finally(() => router.replace(routes.admin.adminLogin));
      return undefined;
    }

    if (access.totpPending) {
      router.replace(routes.admin.adminTotp);
      return undefined;
    }

    let active = true;

    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const result = await getAdminQuestions(filters);

        if (active) {
          setState({
            loading: false,
            error: null,
            items: result.items,
            pagination: result.pagination,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            items: [],
            pagination: null,
          });
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [auth, filters, router]);

  function updateList(nextQuestion) {
    setState((current) => ({
      ...current,
      items: nextQuestion
        ? current.items.map((item) => (item.id === nextQuestion.id ? nextQuestion : item))
        : current.items.filter((item) => item.id !== selectedQuestionId),
    }));
  }

  const statusOptions = getAdminQuestionStatusOptions();

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={t("productQuestions")}
          description={t("adminQuestionsDescription")}
        />

        <Card className="space-y-5 rounded-[2rem]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Input
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value, page: 1 }))}
              placeholder={t("searchQuestions")}
              className="xl:col-span-2"
            />
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.value ? t(option.value) : t("allStatuses")}
                </option>
              ))}
            </Select>
            <Input
              value={filters.product}
              onChange={(event) => setFilters((current) => ({ ...current, product: event.target.value, page: 1 }))}
              placeholder={t("product")}
            />
            <Select
              value={filters.answered}
              onChange={(event) => setFilters((current) => ({ ...current, answered: event.target.value, page: 1 }))}
            >
              <option value="">{t("all")}</option>
              <option value="true">{t("answered")}</option>
              <option value="false">{t("unanswered")}</option>
            </Select>
            <div className="grid gap-3 sm:grid-cols-2 xl:col-span-6">
              <div className="space-y-2">
                <Label htmlFor="questions-date-from">{t("dateFrom")}</Label>
                <Input
                  id="questions-date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value, page: 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="questions-date-to">{t("dateTo")}</Label>
                <Input
                  id="questions-date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value, page: 1 }))}
                />
              </div>
            </div>
          </div>

          {state.loading ? (
            <Card className="space-y-4 rounded-[1.75rem]">
              <div className="h-6 w-48 animate-pulse rounded-full bg-muted" />
              <div className="h-24 animate-pulse rounded-[1.5rem] bg-muted" />
              <div className="h-24 animate-pulse rounded-[1.5rem] bg-muted" />
            </Card>
          ) : null}

          {state.error ? (
            <Alert variant="warning" title={t("failedToLoad")}>
              {t("adminQuestionsLoadError")}
            </Alert>
          ) : null}

          {!state.loading && !state.error && state.items.length === 0 ? (
            <EmptyState
              icon={MessageCircleIcon}
              title={t("productQuestions")}
              description={t("adminQuestionsEmptyDescription")}
            />
          ) : null}

          {!state.loading && state.items.length > 0 ? (
            <>
              <QuestionsTable items={state.items} t={t} locale={locale} onOpen={setSelectedQuestionId} />
              <QuestionsCards items={state.items} t={t} locale={locale} onOpen={setSelectedQuestionId} />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
                <p>
                  {t("showingPageOf", {
                    page: state.pagination?.currentPage ?? 1,
                    totalPages: state.pagination?.totalPages ?? 1,
                  })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(state.pagination?.currentPage ?? 1) <= 1}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: Math.max((state.pagination?.currentPage ?? 1) - 1, 1),
                      }))
                    }
                  >
                    {t("previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(state.pagination?.currentPage ?? 1) >= (state.pagination?.totalPages ?? 1)}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: (state.pagination?.currentPage ?? 1) + 1,
                      }))
                    }
                  >
                    {t("next")}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </Card>
      </div>

      <QuestionDetailPanel
        questionId={selectedQuestionId}
        onClose={() => setSelectedQuestionId("")}
        onUpdated={(_action, nextQuestion) => updateList(nextQuestion)}
      />
    </>
  );
}
