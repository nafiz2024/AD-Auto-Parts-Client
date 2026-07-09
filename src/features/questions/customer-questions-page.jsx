"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import {
  deleteCustomerQuestion,
  getCustomerQuestions,
  updateCustomerQuestion,
} from "@/features/questions/question-api";

function formatDate(value, locale) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getVariant(status) {
  if (status === "published" || status === "answered") {
    return "success";
  }

  if (status === "rejected" || status === "hidden") {
    return "error";
  }

  return "warning";
}

function QuestionEditor({ questionItem, onCancel, onSaved }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    question: questionItem.question ?? "",
    vehicleContext: questionItem.vehicleContext ?? "",
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const updated = await updateCustomerQuestion(questionItem.id, {
          question: form.question,
          vehicleContext: form.vehicleContext || undefined,
        });
        setFieldErrors({});
        onSaved?.(updated);
        toast.success(t("productUpdatedSuccessfully"), t("questionUpdatedDescription"));
      } catch (error) {
        setFieldErrors(error?.fieldErrors ?? {});
        toast.apiError(error, t("questions"));
      }
    });
  }

  return (
    <Card className="space-y-4 rounded-[1.75rem] border-brand-red/20">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t("editQuestion")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{questionItem.productName}</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="question-edit-message">{t("question")}</Label>
          <Textarea
            id="question-edit-message"
            className="min-h-28"
            value={form.question}
            onChange={(event) => updateField("question", event.target.value)}
          />
          {fieldErrors.question ? <p className="text-sm text-error">{fieldErrors.question}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="question-edit-vehicle">{t("vehicleCompatibilityContext")}</Label>
          <Textarea
            id="question-edit-vehicle"
            value={form.vehicleContext}
            onChange={(event) => updateField("vehicleContext", event.target.value)}
          />
          {fieldErrors.vehicleContext ? (
            <p className="text-sm text-error">{fieldErrors.vehicleContext}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? t("saving") : t("saveChanges")}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function CustomerQuestionsPage() {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [filters, setFilters] = useState({ status: "", q: "" });
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
  });
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    let active = true;

    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const result = await getCustomerQuestions(filters);

        if (active) {
          setState({
            loading: false,
            error: null,
            items: result.items,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            items: [],
          });
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [filters]);

  function handleDelete() {
    if (!deletingQuestion) {
      return;
    }

    startDelete(async () => {
      try {
        await deleteCustomerQuestion(deletingQuestion.id);
        setState((current) => ({
          ...current,
          items: current.items.filter((item) => item.id !== deletingQuestion.id),
        }));
        setDeletingQuestion(null);
        toast.success(t("productDeleted"), t("questionDeletedDescription"));
      } catch (error) {
        toast.apiError(error, t("questions"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t("productQuestions")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("customerQuestionsDescription")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <Input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder={t("searchQuestions")}
          />
          <Select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">{t("allStatuses")}</option>
            <option value="pending">{t("pendingQuestion")}</option>
            <option value="published">{t("published")}</option>
            <option value="answered">{t("answered")}</option>
            <option value="rejected">{t("rejected")}</option>
            <option value="hidden">{t("hidden")}</option>
          </Select>
        </div>
      </Card>

      {editingQuestion ? (
        <QuestionEditor
          questionItem={editingQuestion}
          onCancel={() => setEditingQuestion(null)}
          onSaved={(updated) => {
            setState((current) => ({
              ...current,
              items: current.items.map((item) => (item.id === updated.id ? updated : item)),
            }));
            setEditingQuestion(null);
          }}
        />
      ) : null}

      {state.loading ? (
        <Card className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded-full bg-muted" />
          <div className="h-28 animate-pulse rounded-[1.75rem] bg-muted" />
          <div className="h-28 animate-pulse rounded-[1.75rem] bg-muted" />
        </Card>
      ) : null}

      {state.error ? (
        <Alert variant="warning" title={t("failedToLoad")}>
          {state.error.message}
        </Alert>
      ) : null}

      {!state.loading && !state.error && state.items.length === 0 ? (
        <EmptyState
          icon={MessageCircleIcon}
          title={t("noQuestionsYet")}
          description={t("customerQuestionsEmptyDescription")}
        />
      ) : null}

      {!state.loading && state.items.length > 0 ? (
        <div className="space-y-4">
          {state.items.map((questionItem) => {
            const productHref = routes.public.productDetail(
              questionItem.productSlug || questionItem.productId || questionItem.id,
            );

            return (
              <Card key={questionItem.id} className="space-y-4 rounded-[1.75rem]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{questionItem.productName}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>{formatDate(questionItem.createdAt, locale)}</span>
                      {questionItem.updatedAt ? <span>{formatDate(questionItem.updatedAt, locale)}</span> : null}
                    </div>
                  </div>
                  <Badge variant={getVariant(questionItem.status)}>{t(questionItem.status)}</Badge>
                </div>
                <p className="text-sm leading-7 text-foreground">{questionItem.question}</p>
                {questionItem.vehicleContext ? (
                  <p className="rounded-[1rem] bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    {questionItem.vehicleContext}
                  </p>
                ) : null}
                {questionItem.answer ? (
                  <Alert variant="info" title={t("answer")}>
                    {questionItem.answer}
                  </Alert>
                ) : null}
                {questionItem.rejectionReason ? (
                  <Alert variant="warning" title={t("rejectionReason")}>
                    {questionItem.rejectionReason}
                  </Alert>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Link href={productHref}>
                    <Button variant="outline">{t("viewProduct")}</Button>
                  </Link>
                  {questionItem.availableActions.canEdit ? (
                    <Button variant="outline" onClick={() => setEditingQuestion(questionItem)}>
                      {t("editQuestion")}
                    </Button>
                  ) : null}
                  {questionItem.availableActions.canDelete ? (
                    <Button variant="danger" onClick={() => setDeletingQuestion(questionItem)}>
                      {t("deleteQuestion")}
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      <ConfirmationDialog
        open={Boolean(deletingQuestion)}
        title={t("deleteQuestion")}
        description={t("deleteQuestionConfirmation")}
        confirmLabel={isDeleting ? t("deleting") : t("deleteQuestion")}
        cancelLabel={t("cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeletingQuestion(null)}
        tone="destructive"
      />
    </div>
  );
}
