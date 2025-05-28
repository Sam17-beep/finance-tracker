import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  currentPage: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  itemsPerPageOptions?: number[];
  numberOfItems: number;
}

export function CustomPagination({
  currentPage,
  onPageChange,
  maxVisiblePages = 5,
  pageSize,
  onPageSizeChange,
  numberOfItems,
  itemsPerPageOptions = [10, 25, 50, 100],
}: Props) {
  const totalPages = Math.ceil(numberOfItems / pageSize);

  if (totalPages <= 0 && numberOfItems === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (value: string) => {
    onPageSizeChange(Number(value));
    onPageChange(1);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (currentPage - halfVisible <= 1) {
      endPage = Math.min(totalPages, maxVisiblePages);
    }

    if (currentPage + halfVisible >= totalPages) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
        </PaginationItem>,
      );
      if (startPage > 2) {
        pageNumbers.push(<PaginationEllipsis key="ellipsis-start" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onPageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(<PaginationEllipsis key="ellipsis-end" />);
      }
      pageNumbers.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }
    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground text-sm text-nowrap">
          Showing {(currentPage - 1) * pageSize} -{" "}
          {Math.min(currentPage * pageSize, numberOfItems)} of {numberOfItems}{" "}
          items
        </div>
        <Select
          value={pageSize.toString()}
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="w-[120px] text-sm">
            <SelectValue placeholder="Items per page" />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {totalPages > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePrevious}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {renderPageNumbers()}
            <PaginationItem>
              <PaginationNext
                onClick={handleNext}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
