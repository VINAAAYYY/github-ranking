import { Radio, Select, Space, Table, Tag } from 'antd';
import { uniq } from 'lodash';
import { useEffect, useState } from 'react';
import { getLanguagesAsync, getTopReposAsync } from '../api';
import NyanCat from '../assets/nyan-cat.gif';
import { MAX_DATA_COUNT, PAGE_SIZE, POPULAR_LANGUAGES } from '../constants';
import TopicInput from './TopicInput';

import type { TableProps } from 'antd';
import type { ColumnsType, FilterValue } from 'antd/es/table/interface';
import type { Repo } from '../api';

const categoryOptions = [
  {
    label: 'Stars',
    value: 'stars',
  },
  {
    label: 'Forks',
    value: 'forks',
  },
];

const Repositories: React.FC = () => {
  const [sorter, setSorter] = useState('stars');
  const [tableSorter, setTableSorter] = useState(sorter);
  const [language, setLanguage] = useState<string>();
  const [languages, setLanguages] = useState<string[]>();
  const [topic, setTopic] = useState<string>();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [data, setData] = useState<Repo[]>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filteredInfo, setFilteredInfo] = useState<
    Record<string, FilterValue | null>
  >({});

  useEffect(() => {
    const getTopRepos = async (): Promise<void> => {
      setLoading(true);
      const { totalCount, data } = await getTopReposAsync(
        page,
        sorter,
        language,
        topic
      );
      setTotalCount(totalCount);
      setData(data);
      setLoading(false);
      setTableSorter(sorter);
      setFilteredInfo({});
    };
    const id = setTimeout(() => {
      void getTopRepos();
    }, 300);
    return () => {
      clearTimeout(id);
    };
  }, [page, sorter, language, topic]);

  useEffect(() => {
    const getLanguages = async (): Promise<void> => {
      setLanguages(await getLanguagesAsync());
    };
    const id = setTimeout(() => {
      void getLanguages();
    }, 300);
    return () => {
      clearTimeout(id);
    };
  }, []);

  const handleChange: TableProps<Repo>['onChange'] = (pagination, filters) => {
    setFilteredInfo(filters);
  };

  const resetPage = (): void => {
    setPage(1);
  };

  const getTitle = (): JSX.Element => {
    const popularLanguages = {
      label: 'Popular',
      options: POPULAR_LANGUAGES.map((value) => ({
        value,
        label: value,
      })),
    };
    const otherLanguages = {
      label: 'Everything else',
      options: languages
        ?.filter((value) => !POPULAR_LANGUAGES.includes(value))
        .map((value) => ({
          value,
          label: value,
        })),
    };

    return (
      <div className="flex justify-between">
        <Radio.Group
          size="large"
          options={categoryOptions}
          onChange={(e) => {
            setSorter(e.target.value);
            resetPage();
          }}
          value={sorter}
          optionType="button"
          buttonStyle="solid"
        />
        <Space size="large">
          <Space>
            <span className="text-lg font-light">Language:</span>
            <Select
              className="w-36"
              size="large"
              placeholder="Any"
              onChange={(value: string) => {
                setLanguage(value);
                resetPage();
              }}
              options={[popularLanguages, otherLanguages]}
              dropdownMatchSelectWidth={200}
              showSearch
              allowClear
            />
          </Space>
          <Space>
            <span className="text-lg font-light">Topic:</span>
            <TopicInput
              className="w-36"
              placeholder="Any"
              value={topic}
              setValue={setTopic}
              resetPage={resetPage}
            />
          </Space>
        </Space>
      </div>
    );
  };

  return (
    <div className="max-w-6xl px-10 py-6 flex flex-1">
      {data === undefined ? (
        <div className="flex flex-1 justify-center items-center">
          <img className="w-30 h-20" src={NyanCat} alt="loading..." />
        </div>
      ) : (
        <div className="flex-1">
          <Table
            className="shadow-lg"
            rowKey="id"
            title={getTitle}
            loading={loading}
            columns={getColumns(data, tableSorter, filteredInfo)}
            dataSource={data}
            onChange={handleChange}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: totalCount > MAX_DATA_COUNT ? MAX_DATA_COUNT : totalCount,
              showSizeChanger: false,
              onChange(page) {
                setPage(page);
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                });
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

function getColumns(
  data: Repo[],
  sorter: string,
  filteredInfo: Record<string, FilterValue | null>
): ColumnsType<Repo> {
  const categoryOption = categoryOptions.find(
    (option) => option.value === sorter
  );
  const languageFilters = uniq(
    data
      .map((repo) => repo.language)
      .filter((value) => value)
      .sort()
  ).map((value) => ({ text: value, value }));

  languageFilters.unshift({ text: 'N/A', value: '' });

  return [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      align: 'center',
      width: 70,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, { owner, url }) => (
        <div className="flex items-center">
          <a href={owner.url} target="_black" rel="noreferrer">
            <img
              className="w-8 mr-2 rounded-full"
              src={owner.avatarUrl}
              alt="avatar"
            />
          </a>
          <a
            className="font-medium"
            href={url}
            target="_black"
            rel="noreferrer"
          >
            {name}
          </a>
        </div>
      ),
      width: 260,
    },
    {
      title: categoryOption?.label,
      dataIndex: categoryOption?.value,
      key: categoryOption?.value,
      render: (value) => (
        <span className="text-xs font-medium">
          {value >= 1000 ? `${Math.floor(value / 1000)}k` : value}
        </span>
      ),
      width: 80,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description) =>
        description !== null ? (
          <span className="font-light">{description}</span>
        ) : (
          '-'
        ),
    },
    {
      title: 'Language',
      key: 'language',
      dataIndex: 'language',
      // filters: languageFilters,
      // filteredValue: filteredInfo.language ?? null,
      // filterSearch: true,
      // onFilter: (value, record) =>
      //   value === '' ? record.language === null : record.language === value,
      render: (language) =>
        language !== null ? (
          <Tag className="font-medium" color="rgb(14 165 233)" key={language}>
            {language}
          </Tag>
        ) : (
          <Tag className="font-medium" color="rgb(251 146 60)" key="N/A">
            N/A
          </Tag>
        ),
      width: 160,
    },
  ];
}

export default Repositories;
